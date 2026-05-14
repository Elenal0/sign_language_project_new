from __future__ import annotations


# ── ISL gloss → English sentence expansion rules ──────────────────────
# Sign language uses topic-comment structure without articles/prepositions.
# These patterns convert raw gloss into grammatical English candidates
# before the GEC model polishes them.

_GLOSS_EXPANSIONS = {
    "i":        ["I",             "I am",           "I will"],
    "you":      ["You",           "You are",        "You will"],
    "going":    ["going",         "I am going",     "I will go"],
    "meet":     ["meet",          "Nice to meet you","Let us meet"],
    "hello":    ["Hello",         "Hello there",    "Hi"],
    "how":      ["How",           "How are you",    "How are you doing"],
    "nice":     ["Nice",          "That is nice",   "It is nice"],
    "school":   ["school",        "I go to school", "I am at school"],
    "thank you":["Thank you",     "Thank you very much", "Thanks"],
}

_SENTENCE_TEMPLATES = [
    "{words}.",
    "I {words}.",
    "We {words}.",
]


def _gloss_to_candidates(gloss: str) -> list[str]:
    """Convert raw ISL gloss into plausible English sentence candidates."""
    words    = gloss.strip().lower().split()
    n_words  = len(words)

    # Special case: single-word gloss — look up expansion table
    if n_words == 1:
        w   = words[0]
        exp = _GLOSS_EXPANSIONS.get(w)
        if exp:
            return exp
        return [w.capitalize() + ".", "I " + w + ".", w.capitalize()]

    # Special case: starts with "I" + verb → already good structure
    result_words = words.copy()
    if result_words[0] not in ("i", "you", "hello", "thank you"):
        result_words = ["I"] + result_words

    base = " ".join(result_words)
    candidates = [
        base.capitalize() + ".",
        " ".join(words).capitalize() + ".",
        " ".join(w.capitalize() for w in words) + ".",
    ]
    return candidates


class SentenceGenerator:
    """
    Two-stage pipeline:
      Stage 1: Gloss expansion  → plausible English sentence candidates
      Stage 2: GEC T5 model     → polish grammar of each candidate

    Model: vennify/t5-base-grammar-correction
    Prefix: "grammar: <sentence>"   (required by this model)
    """

    def __init__(
        self,
        model_name: str = "vennify/t5-base-grammar-correction",
    ) -> None:
        print("NLP  Loading T5 model, please wait …")
        self._use_t5 = False
        self._lt     = None

        try:
            from transformers import T5ForConditionalGeneration, AutoTokenizer
            import torch
            self._torch     = torch
            self._tokenizer = AutoTokenizer.from_pretrained(model_name)
            self._model     = T5ForConditionalGeneration.from_pretrained(model_name)
            self._model.eval()
            self._use_t5    = True
            print("NLP  T5 model loaded successfully.")
        except Exception as exc:
            print(f"NLP  T5 load failed ({exc}) — using rule-based fallback only.")

    # ── T5 GEC correction ─────────────────────────────────────────────
    def _t5_correct(self, sentence: str) -> str:
        """
        Pass ONE sentence through the GEC model.
        Required prefix: 'grammar: <sentence>'
        """
        prompt = f"grammar: {sentence}"
        inputs = self._tokenizer(
            prompt,
            return_tensors="pt",
            max_length=128,
            truncation=True,
        )
        with self._torch.no_grad():
            output = self._model.generate(
                inputs["input_ids"],
                max_new_tokens=64,
                num_beams=5,
                early_stopping=True,
                no_repeat_ngram_size=2,
                length_penalty=1.0,
            )
        result = self._tokenizer.decode(
            output[0], skip_special_tokens=True
        ).strip()

        # Safety: if model returns something clearly wrong, fall back to input
        if (
            not result
            or len(result) < 3
            or result.lower().startswith("grammar")   # model echoed the prefix
            or result.lower().startswith("gramatica")
            or ":" in result[:12]                     # "Grammar: ..." artefact
        ):
            return sentence.strip().capitalize()

        return result.strip().capitalize()

    # ── rule-based fallback ───────────────────────────────────────────
    def _rule_correct(self, text: str) -> str:
        if self._lt is None:
            try:
                import language_tool_python          # type: ignore
                self._lt = language_tool_python.LanguageTool("en-US")
            except Exception:
                return text.strip().capitalize() + "."
        try:
            return self._lt.correct(text).strip().capitalize()
        except Exception:
            return text.strip().capitalize() + "."

    # ── public API ────────────────────────────────────────────────────
    def generate(self, gloss_text: str, num_options: int = 3) -> list[str]:
        """
        Convert ISL gloss to grammatically correct English options.

        Parameters
        ----------
        gloss_text  : space-separated predicted words, e.g. "I go school"
        num_options : how many distinct suggestions to return

        Returns
        -------
        list of up to num_options corrected English sentences
        """
        # Stage 1 — expand gloss to candidate sentences
        candidates = _gloss_to_candidates(gloss_text)

        # Stage 2 — correct each candidate
        results: list[str] = []
        seen:    set[str]  = set()

        for candidate in candidates:
            if len(results) >= num_options:
                break

            if self._use_t5:
                try:
                    corrected = self._t5_correct(candidate)
                except Exception as exc:
                    print(f"NLP  T5 error on '{candidate}': {exc}")
                    corrected = candidate.strip().capitalize()
            else:
                corrected = self._rule_correct(candidate)

            if corrected and corrected not in seen:
                seen.add(corrected)
                results.append(corrected)

        # Pad with rule-based or plain if still short
        for candidate in candidates:
            if len(results) >= num_options:
                break
            fb = (
                self._rule_correct(candidate)
                if not self._use_t5
                else candidate.strip().capitalize()
            )
            if fb and fb not in seen:
                seen.add(fb)
                results.append(fb)

        return results[:num_options]