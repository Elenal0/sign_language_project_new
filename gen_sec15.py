# gen_sec15.py - Generates Section 15: React Questions (Q223 to Q236)
import sys

def get_sec15_text():
    return r'''## Section 15: React Questions

### Q223. What is React?

**Concept and Fundamentals:**
**React** is an open-source, declarative, component-based JavaScript library developed by Meta for building dynamic, interactive user interfaces, primarily for Single-Page Applications (SPAs).
Core foundational pillars of React:
1. **Declarative Paradigm:** In traditional imperative programming (like Vanilla JavaScript or jQuery), developers manually write DOM manipulation instructions: `document.getElementById('balance').innerText = '$100'`. In React, developers declare **what the UI should look like for a given state**, and React handles the underlying DOM mutations automatically:
   $$\text{UI} = f(\text{State})$$
2. **Component-Based Architecture:** Interfaces are constructed from encapsulated, reusable, independent building blocks called **Components** that manage their own state and compose together to form complex UIs.
3. **The Virtual DOM & Reconciliation:** React maintains an in-memory representation of the real DOM. When state changes, React computes a diff between the new virtual tree and the previous virtual tree (using the **Fiber Reconciliation Algorithm**) and applies only the minimal necessary updates to the physical browser DOM, minimizing expensive reflow and repaint cycles.
4. **Unidirectional (One-Way) Data Flow:** Data flows downward from parent components to child components via read-only **Props**, while events flow upward via callbacks, making state transitions predictable and easy to debug.

**My Project Implementation:**
In VittSaathi, React 18 powers our client-side Single-Page Application:
- Hosted via an Nginx container mapping port 3000.
- Implements responsive financial dashboards using **Tailwind CSS** and **Recharts** for rendering categorical expense pie charts, net worth area graphs, and debt amortization timelines.
- Uses React Router v6 for client-side routing and Axios with interceptors for communicating with our Spring Boot backend.

**Why I Used It:**
Financial wealth tracking requires dynamic, real-time UI updates (e.g., toggling between monthly and annual views, filtering transaction categories) without jarring full-page browser reloads. React's virtual DOM reconciliation and rich ecosystem made it the ideal frontend choice.

**Alternatives and Comparison:**

| Framework / Library | Paradigm | DOM Mechanism | Learning Curve | Ecosystem & Adoption |
| :--- | :--- | :--- | :--- | :--- |
| **React 18 (VittSaathi)** | **Declarative Library (JSX)**| **Virtual DOM (Fiber reconciliation)**| **Moderate** | **Massive (Industry standard)** |
| **Vue.js 3** | Progressive Framework (Template)| Virtual DOM + Proxy reactivity | Low to Moderate | Large, popular in open source |
| **Angular** | Comprehensive Enterprise Framework| Real DOM with Incremental DOM | Steep (TypeScript, RxJS, DI)| Enterprise monoliths |
| **Svelte** | Compile-Time Framework | No Virtual DOM (Compiles to vanilla JS)| Low | High performance, smaller ecosystem|

**Interview-Ready Answer:**
"React is an open-source declarative JavaScript library developed by Meta for building component-based user interfaces. It is built on three core concepts: a component-based architecture for modular UI design, a unidirectional data flow for predictable state management, and the Virtual DOM with the Fiber reconciliation algorithm to batch and minimize expensive browser DOM repaints. 
In VittSaathi, React 18 serves as our Single-Page Application frontend. It consumes our Spring Boot REST APIs and uses libraries like Recharts to render real-time interactive financial visualizations—such as categorical spending breakdowns and debt-avalanche payoff charts—delivering an instantaneous, fluid user experience without full-page reloads."

**Follow-up Depth:**
- *Cross-Question:* Why is React classified as a 'Library' rather than a 'Framework' like Angular?
  - *Answer:* React is strictly focused on the **View layer** of the MVC pattern—it handles UI rendering and component state. It does not dictate how routing, state management, HTTP data fetching, or build tooling must be handled, leaving developers free to choose libraries like React Router, Axios, and Redux/Zustand. In contrast, a framework like Angular is opinionated and batteries-included, providing its own routing, HTTP client, dependency injection, and form validation out of the box.

---

### Q224. What is a component?

**Concept and Fundamentals:**
A **Component** is the fundamental, independent, reusable building block of a React application. It encapsulates presentation structure, business logic, and local state into a cohesive self-contained unit.
Key properties of React Components:
1. **The Pure Function Concept:**
   In modern React (React 16.8+), components are written as **Functional Components**—pure or semi-pure JavaScript functions that accept arbitrary inputs (called **Props**) and return a description of the UI formatted as JSX:
   ```jsx
   function AccountCard({ accountName, balance, currency }) {
       return (
           <div className="card">
               <h3>{accountName}</h3>
               <p>{currency} {balance.toFixed(2)}</p>
           </div>
       );
   }
   ```
2. **Reusability & Modularity:**
   Components follow the DRY (Don't Repeat Yourself) principle. Once an `AccountCard` or `TransactionRow` component is created, it can be instantiated hundreds of times across different views with different props.
3. **Encapsulation:**
   A component manages its own internal state (via `useState`), handles its own user interactions (clicks, form submits), and scopes its styling, preventing leakage to other parts of the application.
4. **Hierarchical Composition:**
   Components nest inside one another to construct an intuitive **Component Tree**:
   $$\text{App} \to \text{DashboardLayout} \to \text{AccountSummaryGrid} \to \text{AccountCard}$$

**My Project Implementation:**
In VittSaathi, our component architecture is organized into:
- **Atom / Molecule UI Components:** `StatCard`, `TransactionTable`, `BudgetProgressBar`, `RiskBadge`.
- **Organisms / Views:** `DashboardView`, `BudgetPlannerView`, `AdvisorChatView`, `LoginModal`.
- **Layouts:** `Navbar`, `Sidebar`, `ProtectedRoute`.

**Why I Used It:**
Componentization allowed us to build consistent UI interfaces, test visual components independently, and maintain a clean separation of concerns.

**Alternatives and Comparison:**

| Paradigm | Reusability | Testability | Maintenance Overhead |
| :--- | :--- | :--- | :--- |
| **React Functional Components (VittSaathi)**| **High (Easily composed)** | **High (Test via React Testing Lib)**| **Low (Clean functions & hooks)** |
| **Legacy React Class Components** | High | Moderate (Verbose lifecycle methods) | Higher (`this` binding, boilerplate)|
| **Monolithic Vanilla HTML/JS** | Poor (Cut-and-paste DOM code) | Very Poor | Severe |

**Interview-Ready Answer:**
"A component in React is an independent, reusable building block that encapsulates its own state, logic, and presentation markup. Modern React components are written as functional components—functions that take props as input and return JSX describing what should appear on the screen. 
In VittSaathi, our entire interface is built from modular components: low-level components like `AccountCard` and `TransactionRow` are reused throughout the application, while higher-level views like `DashboardView` and `AdvisorChatView` compose them into complete layouts. This modularity ensures consistent styling with Tailwind CSS, clean separation of concerns, and straightforward component unit testing."

**Follow-up Depth:**
- *Cross-Question:* What is the difference between a **Controlled Component** and an **Uncontrolled Component** in React forms?
  - *Answer:* In a **Controlled Component**, form input values are driven directly by React state (`value={amount}` paired with `onChange={(e) => setAmount(e.target.value)}`). React is the single source of truth; you can validate input keystroke-by-keystroke. In an **Uncontrolled Component**, the input value is handled directly by the browser DOM itself, and React accesses it on demand using a `useRef()` pointer. Controlled components are the standard for financial inputs to enforce instant validation.

---

### Q225. What is JSX?

**Concept and Fundamentals:**
**JSX (JavaScript XML)** is a syntactic syntax extension for JavaScript recommended by React that allows developers to write HTML-like markup directly inside JavaScript files.
Core technical characteristics of JSX:
1. **Not Valid JavaScript (Compile-Time Transformation):**
   Web browsers cannot execute JSX directly. JSX is a developer-facing syntactic sugar transformed at build time by compilers like **Babel** or modern build tools like **Vite / SWC**:
   - **What you write in JSX:**
     ```jsx
     const element = <div className="balance-box">Total: {balance}</div>;
     ```
   - **What Babel compiles it to (Classic Runtime):**
     ```javascript
     const element = React.createElement(
         "div",
         { className: "balance-box" },
         "Total: ",
         balance
     );
     ```
   - **Modern React 17+ JSX Transform:** Automatically compiles to internal `_jsx("div", { className: "balance-box", children: ... })` calls without requiring `import React from 'react'`.
2. **Full Power of JavaScript Expressions:**
   Any valid JavaScript expression can be embedded inside JSX by wrapping it in curly braces `{}`:
   - Ternary operators: `{isDeficit ? <AlertBadge /> : <SuccessBadge />}`
   - Array mappings: `{transactions.map(tx => <TransactionRow key={tx.id} data={tx} />)}`
   - Math & formatting: `{formatCurrency(account.balance)}`
3. **HTML vs. JSX Differences:**
   - Attribute naming uses **camelCase** (e.g., `onClick`, `onChange`, `tabIndex`).
   - `class` becomes **`className`** (because `class` is a reserved keyword in JavaScript).
   - `for` becomes **`htmlFor`** (because `for` is a reserved loop keyword).
   - All tags must be explicitly **self-closed** (e.g., `<img />`, `<input />`, `<br />`).
4. **Built-In XSS Protection:**
   React automatically escapes all values embedded within curly braces `{}` before rendering them to the DOM. If a malicious user inputs `<script>alert('hack')</script>` as their transaction description, React renders it as harmless plain text, preventing Cross-Site Scripting (XSS) attacks.

**My Project Implementation:**
In VittSaathi, all frontend views (`.jsx` files) utilize JSX to seamlessly combine Tailwind CSS utility classes, dynamic financial numbers, and interactive Recharts components.

**Why I Used It:**
JSX collocates UI rendering logic with business logic, making component development intuitive, visually readable, and safe from XSS vulnerabilities.

**Alternatives and Comparison:**

| Syntax Paradigm | Readability | Build Step Required? | XSS Protection | Developer Velocity |
| :--- | :--- | :--- | :--- | :--- |
| **JSX (React - VittSaathi)**| **High (Resembles HTML)** | **Yes (Babel/Vite)** | **Built-in Auto-Escaping**| **Very High** |
| **Raw `React.createElement`**| Poor (Nested function calls)| No | Built-in | Extremely Slow |
| **Template Strings (HTML in JS)**| Moderate | No | Manual escaping required | Prone to XSS bugs |

**Interview-Ready Answer:**
"JSX stands for JavaScript XML, a syntax extension for JavaScript that lets you write HTML-like markup directly within your component files. It is not native JavaScript; at build time, tools like Babel or Vite compile JSX into `React.createElement()` or `_jsx()` calls that return lightweight JavaScript objects representing the Virtual DOM. 
JSX allows us to embed any dynamic JavaScript expression within curly braces. In VittSaathi, JSX lets us collocate our UI presentation with our business logic—rendering conditional budget alerts or mapping transaction arrays directly into styled table rows. Importantly, JSX automatically escapes embedded strings, protecting our financial app from Cross-Site Scripting attacks."

**Follow-up Depth:**
- *Cross-Question:* Can you inject raw, unescaped HTML in JSX if you deliberately need to render rich formatted text?
  - *Answer:* Yes, React provides the deliberately verbose attribute `dangerouslySetInnerHTML={{ __html: rawHtml }}`. It is intentionally given a scary name to warn developers that using it bypasses React's XSS protections. If user-generated content or third-party text must be rendered this way, the HTML string must first be sanitized through a library like **DOMPurify** (`DOMPurify.sanitize(rawHtml)`) to strip malicious `<script>` tags and event handlers.

---

### Q226. What are props?

**Concept and Fundamentals:**
**Props** (short for "Properties") are read-only, immutable configuration parameters passed from a parent component down to a child component in React's component tree.
Core rules and mechanics of Props:
1. **Unidirectional Data Flow (Top-Down):**
   Props flow exclusively in one direction—from parent to child ($A \to B$). A child component cannot pass props directly back up to its parent.
2. **Strict Immutability (Pure Function Rule):**
   React components must act as **Pure Functions** with respect to their props. A child component **MUST NEVER modify or reassign its incoming props**:
   ```javascript
   // STRICT ANTI-PATTERN: Mutating props directly
   function BalanceDisplay(props) {
       props.balance = 500; // RUNTIME ERROR / VIOLATION
   }
   ```
   If a prop value needs to change in response to a user action, the parent component must own the state and pass down an **event callback function** as a prop, which the child invokes to notify the parent.
3. **Props as Arbitrary Data Carriers:**
   Props can carry any JavaScript type:
   - Primitives: numbers, strings, booleans (`amount={50.0}`, `isDebit={true}`).
   - Complex objects: arrays, maps, DTOs (`transaction={txObject}`).
   - Functions / Callbacks: `onDelete={() => handleDelete(tx.id)}`.
   - React Components / Elements: `icon={<WalletIcon />}`.
   - Children: The special `props.children` prop encapsulates all child markup enclosed between the component's opening and closing JSX tags.

**My Project Implementation:**
In VittSaathi, props structure our dashboard layout:
```jsx
// Parent component:
<BudgetProgressBar 
    category="Dining Out" 
    spent={3400.00} 
    limit={5000.00} 
    onAlertThresholdReached={() => triggerNotification("Dining Out")} 
/>
```
The child `BudgetProgressBar` receives these values as read-only inputs, calculates percentage mathematically, and renders the colored progress bar.

**Why I Used It:**
Props make components reusable, stateless, and easily testable: passing different props to `BudgetProgressBar` renders progress for any category across the application.

**Alternatives and Comparison:**

| Feature | Props | State |
| :--- | :--- | :--- |
| **Origin** | Passed from Parent component | Managed internally within the component |
| **Mutability** | **Strictly Immutable (Read-Only)** | **Mutable via setter function (`setState`)**|
| **Triggers Re-render?**| Yes (When parent passes new prop values)| Yes (When state setter is called) |
| **Component Role** | Configuration / Input | Living dynamic memory |

**Interview-Ready Answer:**
"Props, short for properties, are read-only inputs passed from a parent component down to a child component to configure its behavior and display. Props are strictly immutable—a child component must never alter its own props, adhering to React's pure function principle and unidirectional data flow. 
In VittSaathi, props allow our components to be highly reusable. For example, our `StatCard` component takes props for `title`, `amount`, and `trendDirection`. We instantiate it across our dashboard to display net worth, monthly spending, and savings rate simply by passing different prop values, keeping our UI modular and testable."

**Follow-up Depth:**
- *Cross-Question:* What is **Prop Drilling** and how do you resolve it?
  - *Answer:* Prop Drilling occurs when a piece of state must be passed down through multiple intermediate component layers that do not need the data themselves, solely to reach a deeply nested child component (e.g., `App` $\to$ `Dashboard` $\to$ `Sidebar` $\to$ `UserProfileCard`). Prop drilling bloats code and couples intermediate components. It is resolved using **Component Composition** (passing the child directly via `children`), the **React Context API**, or global state management libraries (like Zustand or Redux).

---

### Q227. What is state?

**Concept and Fundamentals:**
**State** is an encapsulated, dynamic JavaScript object maintained within a React component that holds data that can **change over time** as a result of user interactions, network responses, or timers.
Core foundational properties of State:
1. **Triggers Automated Re-rendering:**
   Whenever a component's state changes, React detects the modification, re-executes the component function, generates a new Virtual DOM tree, and reconciles the updates to the real browser DOM. State is the engine that drives UI interactivity:
   $$\Delta \text{State} \implies \text{Component Re-render} \implies \Delta \text{DOM}$$
2. **Private & Locally Scoped:**
   State is entirely private and encapsulated within the component that declares it. Sibling components have zero direct access to each other's state.
3. **State Immutability (Never Mutate Directly):**
   State in React must **NEVER be modified directly**:
   ```javascript
   // CATASTROPHIC ANTI-PATTERN: Direct mutation
   state.balance = 500; // React cannot detect this; UI will NOT re-render!
   
   // CORRECT PATTERN: Use the setter function
   setBalance(500); // Schedules a state transition and queues a re-render
   ```
4. **Asynchronous Batching:**
   In React 18, state updates are batched automatically across event handlers, promises, and `setTimeout` calls to prevent redundant re-renders and maximize browser performance.

**My Project Implementation:**
In VittSaathi, state manages dynamic user interactions:
- In `TransactionForm.jsx`: local state tracks form inputs (`amount`, `category`, `type`).
- In `DashboardView.jsx`: state holds the active date filter (`selectedMonth`, `selectedYear`) and the fetched `dashboardData` DTO.
- In `AuthContext.jsx`: global state holds the active JWT access token and logged-in user profile.

**Why I Used It:**
State allows our interface to respond immediately to user clicks, keyboard typing, and API data arrivals, transforming static HTML into a responsive application.

**Alternatives and Comparison:**

| Characteristic | Local Component State (`useState`) | Global State (Context / Redux) |
| :--- | :--- | :--- |
| **Scope** | Single component instance | Entire application component tree |
| **Persistence** | Discarded when component unmounts | Persists across view navigations |
| **Best Used For** | Form inputs, modal open/close, active tabs| Auth tokens, user profiles, theme preferences |

**Interview-Ready Answer:**
"State is an internal, dynamic data store managed within a React component that represents data that changes over the component's lifecycle due to user actions or API responses. Crucially, updating state triggers React's reconciliation process, causing the component to re-render with the new data. 
In VittSaathi, we use state for local component interactions—such as storing form inputs in our transaction logging modal or tracking the active month filter—and manage global state via React Context for authentication tokens. We strictly maintain immutability by always using setter functions like `setBalance()` rather than mutating variables directly."

**Follow-up Depth:**
- *Cross-Question:* How does React 18's **Automatic Batching** work?
  - *Answer:* Prior to React 18, React only batched multiple state updates inside native React event handlers (like `onClick`). If you called two state updates inside an asynchronous `fetch()` promise or `setTimeout`, React would re-render the component twice. **React 18 introduced Automatic Batching**: whether state updates occur inside click handlers, promises, async/await functions, or timeouts, React batches them into a single re-render, cutting unnecessary render cycles and boosting application performance.

---

### Q228. Props vs state?

**Concept and Fundamentals:**
Understanding the precise boundary between Props and State is the single most important architectural concept in React engineering:

| Architectural Metric | Props (Properties) | State |
| :--- | :--- | :--- |
| **Definition** | Data passed into a component from its parent | Data managed and held internally within a component |
| **Mutability** | **Strictly Immutable (Read-Only)** | **Mutable via setter function (`setState`)** |
| **Ownership** | Owned by the Parent component | Owned locally by the Component itself |
| **Component Role** | Acts as configuration inputs (like function arguments)| Acts as internal memory (like local variables) |
| **Directionality** | Unidirectional Top-Down ($Parent \to Child$) | Encapsulated locally (Can be passed down as props to children)|
| **Re-render Trigger** | Re-renders when parent passes new prop values | Re-renders when internal state setter is invoked |
| **Analogy** | Function Parameters: `function add(a, b)` | Local Function Variables: `let count = 0;` |

**The Interplay Between Props and State (Lifting State Up):**
In a well-designed React application, state and props work in a continuous cycle:
1. A parent component declares dynamic state (`const [selectedMonth, setSelectedMonth] = useState('October')`).
2. The parent passes `selectedMonth` down to Child Component A as a **read-only Prop** for display.
3. The parent passes the setter callback `setSelectedMonth` down to Child Component B as an **event handler Prop**.
4. When the user selects a new month in Child B, it calls the callback prop; the parent's state updates; and both Child A and Child B re-render automatically with the new data.

**My Project Implementation:**
In VittSaathi:
- In `TransactionTable`: the list of transactions is received as a **Prop** from `DashboardView`. The table cannot modify this list directly.
- In `TransactionTable`: the active sorting column (`sortField`) and pagination index (`currentPage`) are managed locally as **State**, because only the table cares about its pagination view.

**Why I Used It:**
Distinguishing props from state keeps our components decoupled, minimizes redundant state duplication, and ensures predictable data flow.

**Alternatives and Comparison:**

| Scenario | Should it be Props or State? | Rationale |
| :--- | :--- | :--- |
| **User's Full Name on Profile Banner**| **Props** (Passed from User Context) | Parent owns auth data; banner just renders it |
| **Is Dropdown Open?** | **State** (Local to Dropdown) | Only the dropdown cares about open/closed toggle |
| **Transaction Filter Date** | **State in Parent, Props in Children**| Shared by multiple sibling components |

**Interview-Ready Answer:**
"The core difference is that props are read-only configuration inputs passed from a parent component down to a child, whereas state is dynamic data managed internally by the component itself. Props are immutable from the child's perspective—much like function parameters—while state represents a component's mutable memory that triggers a re-render whenever updated. 
In VittSaathi, our `DashboardView` manages the user's financial data in state after fetching it from Spring Boot, and passes individual accounts and transactions down to presentational components like `AccountCard` and `TransactionTable` as read-only props, adhering strictly to unidirectional data flow."

**Follow-up Depth:**
- *Cross-Question:* What is a **Stateless (Presentational / Dumb) Component** versus a **Stateful (Container / Smart) Component**?
  - *Answer:* A **Stateless Component** possesses zero internal state; it relies entirely on props for its data and renders UI purely as a function of those props (e.g., our `StatCard` or `AlertBadge`). They are easy to test and reuse. A **Stateful Component** manages internal state, fetches data from APIs via `useEffect`, handles business workflows, and passes data down to stateless presentational components (e.g., our `DashboardView`).

---

### Q229. What is useState?

**Concept and Fundamentals:**
**`useState`** is the foundational Built-In Hook introduced in React 16.8 that allows functional components to declare, maintain, and update local state without writing legacy ES6 classes.
Syntax and Anatomical Breakdown:
```javascript
const [state, setState] = useState(initialValue);
```
1. **Array Destructuring:** `useState` returns an array with exactly two elements:
   - `state` (Index 0): The current snapshot of the state value.
   - `setState` (Index 1): The dispatch/setter function used to update the state and schedule a component re-render.
2. **Initial Value:**
   - Evaluated only on the component's initial mount.
   - Supports **Lazy Initial State**: passing a function `useState(() => expensiveCalculation())` ensures the expensive setup function executes **only once** on initial mount, rather than on every single re-render.
3. **The Immutability Paradigm with Objects and Arrays:**
   Because React relies on shallow reference equality checks (`Object.is`) to determine whether state has changed, modifying an existing object or array in-place and passing it to `setState` will fail to trigger a re-render:
   ```javascript
   // ANTI-PATTERN: Mutating array in-place
   transactions.push(newTx);
   setTransactions(transactions); // Reference unchanged! React will NOT re-render!

   // CORRECT PATTERN: Create a new array reference via spread operator
   setTransactions([...transactions, newTx]);
   ```
4. **Functional State Updates (Preventing Stale Closures):**
   When updating state based on its previous value under concurrent conditions, always use the functional updater syntax:
   ```javascript
   setCount(prevCount => prevCount + 1); // Guarantees latest state snapshot
   ```

**My Project Implementation:**
In VittSaathi, `useState` is used across all interactive components:
- `const [amount, setAmount] = useState('')` in transaction forms.
- `const [isModalOpen, setIsModalOpen] = useState(false)` for popup dialogs.
- `const [categoryFilter, setCategoryFilter] = useState('ALL')` for ledger filtering.

**Why I Used It:**
`useState` provides simple, concise, and type-safe state management within functional components, eliminating verbose class constructors and `this` binding boilerplate.

**Alternatives and Comparison:**

| State Hook | Complexity | Best For | Implementation |
| :--- | :--- | :--- | :--- |
| **`useState` (VittSaathi)** | **Low** | **Independent, simple state primitives/objects**| Direct setter calls |
| **`useReducer`** | Moderate to High | Complex state logic with multiple sub-actions | Redux-style action dispatching |
| **`useRef`** | Low | Mutable values that do NOT trigger re-renders | Direct DOM pointers |

**Interview-Ready Answer:**
"`useState` is a core React Hook that adds state to functional components. It takes an initial value and returns a pair via array destructuring: the current state value and a setter function. Calling the setter schedules a state update and triggers a component re-render. 
In VittSaathi, we use `useState` for UI interactions like managing form inputs and modal visibility. When updating arrays or objects—like appending a new transaction—we adhere strictly to immutability by using the spread operator to pass a brand-new reference, such as `setTransactions([...prev, newTx])`, ensuring React's reconciliation engine detects the change and updates the DOM."

**Follow-up Depth:**
- *Cross-Question:* Why are React Hooks not allowed to be called inside `if` statements, loops, or nested functions?
  - *Answer:* This is the **First Rule of Hooks**. Under the hood, React does not track hooks by name; it maintains a single internal **Singly-Linked List of Hook Fiber Nodes** ordered by execution index. For React to know which state corresponds to which `useState` call across re-renders, **hooks must be called in the exact same order on every single render**. Placing a hook inside an `if` block would alter the execution order if the condition changes, desynchronizing the internal hook array and corrupting component state.

---

### Q230. What is useEffect?

**Concept and Fundamentals:**
**`useEffect`** is the primary React Hook used to manage **Side Effects** in functional components.
What is a Side Effect in React?
A pure React component should only compute JSX from props and state. Any operation that interacts with the outside world beyond the component's immediate render cycle is a Side Effect:
- Fetching data over the network via HTTP/REST (Axios/fetch).
- Directly manipulating the browser DOM (e.g., setting document titles).
- Setting up timers (`setInterval`, `setTimeout`).
- Subscribing to external event listeners or WebSockets.

**Syntax and The Dependency Array:**
```javascript
useEffect(() => {
    // 1. Effect Code (Executes after render)
    
    return () => {
        // 2. Cleanup Function (Executes before next effect or on unmount)
    };
}, [dependencies]); // 3. Dependency Array
```

**The Three Operational Modes of `useEffect`:**
1. **Empty Dependency Array `[]` (Mount Only):**
   Runs **exactly once** after the component's initial mount to the DOM. Ideal for initial API data loading.
2. **With Dependencies `[userEmail, selectedMonth]` (On Change):**
   Runs after initial mount, and then **re-executes only when one of the specified dependencies changes reference** (`Object.is` check).
3. **No Dependency Array Omitted (Every Render):**
   Runs after **every single render cycle**. (Severe performance hazard; rarely used).
4. **The Cleanup Function:**
   Returned at the end of the effect. Runs when the component **unmounts** or **immediately before the effect re-runs**, used to clear timers, close WebSocket sockets, or abort pending HTTP requests (`AbortController`).

**My Project Implementation:**
In VittSaathi, `useEffect` orchestrates initial dashboard data fetching:
```jsx
useEffect(() => {
    const controller = new AbortController();

    async function fetchDashboard() {
        try {
            setIsLoading(true);
            const data = await dashboardService.getSummary(selectedMonth, { signal: controller.signal });
            setDashboardData(data);
        } catch (err) {
            if (err.name !== 'CanceledError') setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    fetchDashboard();

    return () => controller.abort(); // Cleanup: Cancels in-flight network request on unmount
}, [selectedMonth]); // Re-fetches whenever the user changes the month filter
```

**Why I Used It:**
`useEffect` decouples rendering from network I/O, prevents infinite render loops, and ensures network requests are properly cleaned up when users navigate away.

**Alternatives and Comparison:**

| Dependency Array Setting | When Does the Effect Execute? | Typical Use Case |
| :--- | :--- | :--- |
| **`useEffect(..., [])`** | **Once after Initial Mount** | Initial user profile / transaction fetch |
| **`useEffect(..., [month])`** | **Mount + When `month` changes** | Filtered dashboard data reloading |
| **`useEffect(...)` (No array)** | After **Every Single Render** | Logging / Telemetry (Hazardous for APIs) |

**Interview-Ready Answer:**
"`useEffect` is a React Hook designed to perform side effects in functional components, such as data fetching, subscriptions, and DOM manipulations. It takes an effect function and an optional dependency array: passing an empty array runs the effect once on mount; passing dependencies re-runs it whenever those values change. 
In VittSaathi, we use `useEffect` to load financial dashboard summaries from Spring Boot. We pass `[selectedMonth]` as a dependency so that when the user toggles months, the effect re-executes. Crucially, we include a cleanup function using an `AbortController` to cancel in-flight network requests if the user navigates away before the response arrives, preventing memory leaks and state updates on unmounted components."

**Follow-up Depth:**
- *Cross-Question:* Why does `useEffect` run **twice** on initial mount in React 18 during local development?
  - *Answer:* In React 18, when running in **StrictMode (`<React.StrictMode>`)** during local development, React intentionally mounts, unmounts, and re-mounts every component immediately. This is an intentional development-only stress-test designed to help developers identify missing cleanup functions (such as unclosed WebSocket connections or unfreed timers) that would cause memory leaks in production. In production builds, components mount exactly once.

---

### Q231. What is the Virtual DOM?

**Concept and Fundamentals:**
The **Virtual DOM (VDOM)** is a lightweight, in-memory tree representation of the physical browser Document Object Model (DOM), maintained in JavaScript memory by React.
Why the Physical Browser DOM is a Performance Bottleneck:
- The real browser DOM is slow to update. Modifying a DOM element is not a simple memory write; it forces the browser engine (Blink/Gecko) to execute expensive layout calculations, recalculate CSS rules, perform **Reflow (Layout)**, and execute **Repaint** across the GPU.
- If a JavaScript script updates 100 table rows imperatively one by one, the browser executes up to 100 separate reflow/repaint passes, causing visible UI jank and frame drops.

**How the Virtual DOM Solves This (The Reconciliation Algorithm):**
1. **Render Phase:**
   When component state changes, React calls the component function and builds a brand-new Virtual DOM tree of plain JavaScript objects (`{ type: 'div', props: { className: 'card', children: ... } }`).
2. **Diffing Phase (Fiber Reconciliation):**
   React compares the newly generated Virtual DOM tree against the previous Virtual DOM tree using an optimized **$O(N)$ heuristic diffing algorithm** (based on React Fiber):
   - Two elements of different types produce completely different trees.
   - Elements with stable **`key`** props are matched across renders without re-creation.
3. **Commit Phase:**
   React batches all detected differences into a minimal changeset and applies them to the physical browser DOM in a single synchronous pass, performing the absolute minimum number of real DOM updates.

**My Project Implementation:**
In VittSaathi, our transaction ledger displays hundreds of rows. When a user filters transactions by category ("FOOD"), React builds the new virtual tree, computes that only the non-food rows need to be removed, and patches the real DOM in a single sub-millisecond pass, keeping our Recharts animations smooth at 60 FPS.

**Why I Used It:**
The Virtual DOM abstracts away direct DOM manipulation, eliminates manual performance tuning, and ensures high frame-rate rendering across complex financial dashboards.

**Alternatives and Comparison:**

| Rendering Architecture | Update Mechanism | Memory Overhead | Performance Profile | Example |
| :--- | :--- | :--- | :--- | :--- |
| **Virtual DOM (VittSaathi)** | In-memory tree diffing + batched DOM write | Moderate (Holds VDOM trees in RAM)| Fast for complex, dynamic UIs | React, Vue |
| **Direct Real DOM (Vanilla)** | Imperative DOM manipulation (`appendChild`)| Zero | Slow if un-optimized (causes reflows)| Vanilla JS, jQuery |
| **Compile-Time Reactive (No VDOM)**| Compiler generates targeted DOM patch code| Lowest | Ultra-Fast | Svelte, SolidJS |

**Interview-Ready Answer:**
"The Virtual DOM is a lightweight, in-memory JavaScript representation of the real browser DOM. Updating the physical browser DOM is computationally expensive because every change forces the browser engine to recalculate CSS styles, recompute page layouts, and repaint pixels. 
React solves this through reconciliation: when state changes, React creates a new Virtual DOM tree, diffs it against the previous virtual tree using its Fiber algorithm to identify the exact differences, and then batches only the minimal required mutations into the real DOM in a single pass. In VittSaathi, this allows our transaction tables and interactive financial charts to update fluidly at 60 FPS without UI jank."

**Follow-up Depth:**
- *Cross-Question:* Why is the **`key`** prop mandatory when rendering lists of elements in JSX, and why is using array index as a key an anti-pattern?
  - *Answer:* The `key` prop gives list elements a stable identity across renders. During reconciliation, React matches virtual nodes by their key. If you use **array indices (`key={index}`)** as keys and delete the first item in a transaction list, all subsequent items shift indices ($1 \to 0, 2 \to 1$). React mistakenly assumes every single item was modified rather than just one item removed, re-rendering the entire list and corrupting local component states (like open inputs). Using unique primary keys (`key={tx.id}`) allows React to immediately identify the exact row that was removed with zero unnecessary re-renders.

---

### Q232. How does React communicate with Spring Boot?

**Concept and Fundamentals:**
Communication between the decoupled React frontend and the Spring Boot backend follows a standard **Headless RESTful Client-Server Protocol over HTTP/HTTPS**:

```
[ React SPA (Browser) ]
       |
       | 1. Axios Request with Interceptor
       |    GET /api/v1/accounts
       |    Header: "Authorization: Bearer <JWT>"
       v
[ Nginx Reverse Proxy / Port 80 ] (Optional Gateway)
       |
       v
[ Spring Boot DispatcherServlet / Port 8080 ]
       |
       | 2. JwtAuthenticationFilter verifies token
       | 3. AccountController -> AccountService -> PostgreSQL
       | 4. Jackson serializes DTO to JSON
       v
[ HTTP Response: 200 OK ]
[ Content-Type: application/json ]
       |
       v
[ Axios Response Interceptor ]
       |
       v
[ React State Update: setAccounts(data) ]
```

**Key Communication Layers:**
1. **HTTP Client (Axios):**
   React uses **Axios** (or native `fetch`) to dispatch asynchronous HTTP requests. Axios provides automatic JSON transformation, request cancellation via `AbortController`, and centralized interceptors.
2. **Axios Request Interceptor (JWT Injection):**
   Before any request leaves the browser, a global Axios interceptor automatically retrieves the in-memory access token and attaches it to the HTTP header:
   ```javascript
   apiClient.interceptors.request.use((config) => {
       const token = getAccessToken(); // From in-memory auth state
       if (token) {
           config.headers.Authorization = `Bearer ${token}`;
       }
       return config;
   });
   ```
3. **CORS (Cross-Origin Resource Sharing):**
   Because React runs on `http://localhost:3000` and Spring Boot runs on `http://localhost:8080` during development, Spring Boot must explicitly configure CORS to permit headers, credentials, and methods from the frontend origin.
4. **Data Contract Serialization:**
   Spring Boot uses Jackson to serialize Java DTOs into JSON; React parses the JSON stream directly into native JavaScript objects.

**My Project Implementation:**
In VittSaathi, all API communication is centralized in an `api/` module (`apiClient.js`, `transactionService.js`, `authService.js`). Controllers return standardized `ResponseEntity<DTO>` payloads that React components consume within `useEffect` hooks.

**Why I Used It:**
A decoupled REST architecture allows the frontend and backend to evolve independently, scale on different container schedules, and adhere to industry standard separation of concerns.

**Alternatives and Comparison:**

| Communication Technology | Data Format | Real-Time Support | Best For |
| :--- | :--- | :--- | :--- |
| **REST over HTTPS (Axios - VittSaathi)**| **JSON** | Request-Response | CRUD operations, standard APIs |
| **Server-Sent Events (SSE)** | Text Stream | One-way Real-Time | Streaming LLM tokens from AI service |
| **WebSockets** | Binary / Text | Full-Duplex Bi-directional| Real-time trading, chat apps |
| **GraphQL** | JSON (Client-queried)| Request-Response | Complex multi-resource aggregation |

**Interview-Ready Answer:**
"React communicates with Spring Boot asynchronously over HTTPS using RESTful JSON APIs managed through Axios. In VittSaathi, our API client is configured with global Axios request interceptors that automatically attach the user's JWT Bearer token to the Authorization header on every outgoing call. 
Spring Boot's DispatcherServlet handles the request, verifies the token in its security filter chain, queries PostgreSQL, and serializes Java DTOs into JSON. Our Axios response interceptors then resolve the data into React state. For streaming AI advisory advice, we supplement standard REST with Server-Sent Events to stream generated tokens in real time."

**Follow-up Depth:**
- *Cross-Question:* How do you prevent **CORS errors** when developing React on port 3000 and Spring Boot on port 8080 locally?
  - *Answer:* In development, CORS errors can be eliminated through two methods:
    1. **Spring Boot CORS Configuration:** Define a `@CrossOrigin(origins = "http://localhost:3000")` annotation on controllers, or register a global `CorsConfigurationSource` bean in Spring Security allowing the origin, methods (`GET`, `POST`, `PUT`, `DELETE`), and headers (`Authorization`, `Content-Type`).
    2. **Frontend Development Proxy:** Configure a reverse proxy in `vite.config.js` or `package.json` (`"proxy": "http://localhost:8080"`). The browser sends requests to its own port (`localhost:3000/api/...`), and the development server forwards them to port 8080 server-side, completely bypassing browser CORS checks.

---

### Q233. How do you store authentication state?

**Concept and Fundamentals:**
Managing authentication state in a Single-Page Application requires balancing **Security (XSS/CSRF resistance)** with **Persistence (surviving page refreshes)** and **Global Availability across the Component Tree**:

1. **Global Accessibility (React Context API):**
   Authentication state (whether the user is logged in, their role, and current access token) must be accessible by navigation bars, protected routes, and API interceptors without prop drilling. We encapsulate this in an **`AuthContext`** provider wrapping the root component:
   ```jsx
   export const AuthContext = createContext();

   export function AuthProvider({ children }) {
       const [user, setUser] = useState(null); // User profile
       const [token, setToken] = useState(null); // Short-lived Access Token
       const [isLoading, setIsLoading] = useState(true);

       // Login, Logout, and Token Refresh functions...
       return (
           <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
               {children}
           </AuthContext.Provider>
       );
   }
   ```
2. **Secure Token Storage Architecture (The OWASP Standard):**
   - **Access Token (15-min Lifespan):** Stored strictly **in memory** inside the React `token` state variable. Because it is never written to `localStorage` or `sessionStorage`, malicious XSS scripts cannot steal it from web storage.
   - **Refresh Token (7-day Lifespan):** Stored in a secure **`HttpOnly`, `Secure`, `SameSite=Strict` Cookie** issued by the backend. Client-side JavaScript cannot read this cookie under any circumstances.
3. **Surviving Page Refreshes (Silent Bootstrapping):**
   When the user refreshes the browser (F5), React memory resets and the in-memory access token is lost.
   - On initial mount, `AuthProvider`'s `useEffect` fires a silent background call to `POST /api/v1/auth/refresh`.
   - The browser automatically attaches the `HttpOnly` refresh cookie.
   - Spring Boot validates the refresh token and returns a fresh 15-minute access token into memory.
   - `setIsLoading(false)` completes, and the user remains logged in without seeing a login screen.

**My Project Implementation:**
In VittSaathi, this hybrid in-memory + HttpOnly cookie architecture is implemented in `context/AuthContext.jsx`, exposed via a custom hook `useAuth()`.

**Why I Used It:**
This architecture delivers maximum defense against XSS token theft while providing a seamless user experience across page refreshes.

**Alternatives and Comparison:**

| Storage Approach | XSS Security | CSRF Security | Persistence Across Refresh |
| :--- | :--- | :--- | :--- |
| **In-Memory + HttpOnly Cookie (VittSaathi)**| **High (Token in RAM)** | **High (`SameSite=Strict`)**| **Seamless (Silent refresh)** |
| **All in `localStorage`** | **Terrible (Trivially stolen via XSS)**| Immune | Trivially persistent |
| **All in Standard Cookies** | Poor (Accessible via JS) | Vulnerable without tokens | Persistent |

**Interview-Ready Answer:**
"We store authentication state using React's Context API backed by a secure hybrid storage model recommended by OWASP. The short-lived 15-minute access token is stored strictly in React memory state inside our `AuthContext`, making it completely inaccessible to XSS storage scrapers. The long-lived refresh token is stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie that client-side JavaScript cannot access. 
When the user refreshes the page, an initial `useEffect` in our `AuthProvider` fires a silent refresh request to Spring Boot; the browser automatically sends the secure cookie, and Spring Boot returns a new access token into memory, keeping the user seamlessly authenticated without exposing tokens to web storage."

**Follow-up Depth:**
- *Cross-Question:* How do you prevent a 'Flash of Unauthenticated Content' (FOUC) while the silent refresh is executing on page load?
  - *Answer:* We maintain an `isLoading` boolean flag in `AuthContext`, initialized to `true`. While the silent refresh call is in flight, our `ProtectedRoute` component displays a clean loading spinner rather than redirecting to `/login`. Only when the refresh call resolves (setting user state and `isLoading = false`) or rejects (user is genuinely logged out) does the router decide whether to render the protected dashboard or redirect to login.

---

### Q234. How do you handle API errors?

**Concept and Fundamentals:**
In enterprise frontends, error handling must be structured into a **Cohesive Two-Tiered Error Architecture**:
1. **Global Interceptor Tier (Automated Infrastructure Recovery):** Handled via Axios response interceptors for standardized HTTP error status codes.
2. **Local Component Tier (User Experience & Feedback):** Handled via try-catch blocks and UI notification banners for form validation and business rule violations.

**The Global Axios Interceptor Protocol:**
```javascript
apiClient.interceptors.response.use(
    (response) => response, // Pass successful responses through
    async (error) => {
        const originalRequest = error.config;
        
        // 1. Handle Expired Token (401 Unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const newToken = await refreshAccessToken();
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest); // Replay original failed request!
            } catch (refreshErr) {
                forceLogout(); // Refresh token expired; redirect to login
                return Promise.reject(refreshErr);
            }
        }
        
        // 2. Handle Forbidden (403 Access Denied)
        if (error.response?.status === 403) {
            toast.error("You do not have permission to perform this action.");
        }
        
        // 3. Handle Server Outages (500 / 503 / Network Error)
        if (!error.response || error.response.status >= 500) {
            toast.error("Service temporarily unavailable. Please try again shortly.");
        }

        return Promise.reject(error);
    }
);
```

**Local Component Handling:**
Inside components (e.g., `TransactionForm.jsx`):
- When a `400 Bad Request` occurs, the component catches the error and reads Spring Boot's structured validation payload: `{"amount": "Amount must be strictly positive"}`.
- It maps the error strings directly to inline red warning borders beneath the corresponding input fields.

**React Error Boundaries:**
Wrap component subtrees in a React **`ErrorBoundary`** to catch unexpected JavaScript runtime crashes (e.g., trying to read `.map()` on `undefined`), rendering a graceful fallback screen instead of a white crash screen.

**My Project Implementation:**
In VittSaathi, Axios interceptors handle automated 401 token refreshing and toast notifications, while forms handle field validation errors and an ErrorBoundary protects the root view.

**Why I Used It:**
Automated error handling provides self-healing network retries, protects users from technical stack traces, and ensures graceful UI degradation.

**Alternatives and Comparison:**

| Error Type | Handled Where? | Action Taken |
| :--- | :--- | :--- |
| **401 Token Expired** | Global Axios Interceptor | Silent token refresh & automatic request replay |
| **400 Validation Failure** | Local Component `try-catch` | Highlights specific form fields in red |
| **403 Forbidden** | Global Interceptor | Displays 'Access Denied' toast notification |
| **500 Server Fault** | Global Interceptor + Fallback | Displays friendly error toast; logs trace ID |
| **React Runtime Crash** | React `ErrorBoundary` | Renders 'Something went wrong' fallback card |

**Interview-Ready Answer:**
"We handle API errors using a two-tiered approach: centralized global handling via Axios interceptors and localized component feedback for user input validation. 
Our Axios response interceptor intercepts HTTP 401 Unauthorized errors to automatically execute our silent refresh token workflow, replaying the failed request transparently. For 500 server faults or network disconnects, it displays user-friendly toast notifications. Meanwhile, at the component level, our forms catch 400 Bad Request validation errors and highlight the specific invalid input fields. Finally, we wrap our UI tree in a React ErrorBoundary to prevent unexpected rendering errors from crashing the entire browser window."

**Follow-up Depth:**
- *Cross-Question:* What is a React **ErrorBoundary** and what lifecycle methods does it use?
  - *Answer:* An ErrorBoundary is a specialized React component that catches JavaScript errors anywhere in its child component tree, logs the errors, and displays a fallback UI instead of crashing the app. It must be implemented as a Class Component because it relies on two lifecycle methods that functional components do not currently support:
    - `static getDerivedStateFromError(error)`: Updates state to render the fallback UI on next render.
    - `componentDidCatch(error, errorInfo)`: Used to log error telemetry and stack traces to services like Sentry.

---

### Q235. How do you protect frontend routes?

**Concept and Fundamentals:**
In a Single-Page Application (SPA), all routing occurs on the client side via the browser History API (using **React Router**).
Protecting frontend routes ensures that unauthenticated users cannot navigate to private views (e.g., `/dashboard`, `/budgets`, `/ai-advisor`) and unauthorized users cannot view administrative views.
Important architectural truth about client-side route protection:
> **Client-side route protection is a User Experience (UX) feature, NOT a security boundary!**
Because React code runs in the user's browser, a skilled user can alter JavaScript memory to bypass client-side route guards. **True security is enforced strictly by the Spring Boot backend rejecting unauthenticated API calls.** Client-side route protection simply provides clean UX by preventing users from staring at blank, unauthorized screens.

**The ProtectedRoute Wrapper Pattern:**
In React Router v6, protected routes are implemented using an encapsulating wrapper component:
```jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ allowedRoles }) {
    const { user, token, isLoading } = useAuth();
    const location = useLocation();

    // 1. Show spinner while verifying silent refresh token on boot
    if (isLoading) {
        return <div className="spinner">Loading VittSaathi...</div>;
    }

    // 2. If unauthenticated, redirect to /login saving return path
    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. If role-restricted, verify user holds required role
    if (allowedRoles && !allowedRoles.some(role => user.roles.includes(role))) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 4. Authenticated & Authorized: Render the private child route!
    return <Outlet />;
}
```

**Wiring in the Router:**
```jsx
<Routes>
    {/* Public Routes */}
    <Route path="/login" element={<LoginView />} />
    <Route path="/register" element={<RegisterView />} />

    {/* Protected Private Routes */}
    <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/budgets" element={<BudgetView />} />
        <Route path="/advisor" element={<AdvisorChatView />} />
    </Route>
</Routes>
```

**My Project Implementation:**
In VittSaathi, all private views are nested inside `ProtectedRoute` in `App.jsx`. If an unauthenticated user bookmarks `/dashboard` and opens it, they are redirected to `/login`, and after authenticating, they are automatically returned back to `/dashboard`.

**Why I Used It:**
The `ProtectedRoute` wrapper centralizes authentication checks, eliminates code duplication, and provides a clean navigation experience.

**Alternatives and Comparison:**

| Implementation Pattern | Code Redundancy | Maintenance | React Router v6 Standard? |
| :--- | :--- | :--- | :--- |
| **`ProtectedRoute` Wrapper (`<Outlet />`)**| **Zero (Wrap parent route)** | **Single file to maintain** | **Yes (Official Best Practice)** |
| **`useEffect` checks in every view** | Massive (Repeated in 10 files)| High (Easy to forget on new pages)| Deprecated pattern |
| **Server-Side Page Redirects** | High | Destroys SPA architecture | Non-SPA |

**Interview-Ready Answer:**
"We protect frontend routes using a `ProtectedRoute` wrapper component in React Router v6. The wrapper accesses our `AuthContext`: if the initial authentication check is still loading, it displays a spinner to prevent flashing; if the user is unauthenticated, it uses `<Navigate to=\"/login\">` to redirect them while preserving their intended return location. If the route requires specific roles, it asserts that the user's role list contains the permitted authorities before rendering child routes via `<Outlet />`. 
We also recognize that client-side route protection is a user experience enhancement; the authoritative security boundary remains our Spring Boot backend, which rejects any unauthorized API calls with HTTP 401."

**Follow-up Depth:**
- *Cross-Question:* How do you preserve the user's intended destination so they don't have to re-navigate after logging in?
  - *Answer:* When `ProtectedRoute` redirects to `/login`, it passes the current URL in React Router's location state: `<Navigate to="/login" state={{ from: location }} replace />`. Inside `LoginView.jsx`, once authentication succeeds, we inspect `location.state?.from?.pathname`. If a return path exists, we navigate the user directly to that requested page (`/budgets`); otherwise, we default to `/dashboard`.

---

### Q236. What happens when the JWT expires?

**Concept and Fundamentals:**
When a short-lived access token (e.g., 15 minutes) expires while a user is actively interacting with the React application, the application must handle the expiration seamlessly without interrupting the user's workflow:

**The Automated Silent Refresh Flow:**
```
React App                        Spring Boot Backend
    |                                    |
1.  |--- GET /api/v1/transactions ------>| (With Expired Access Token)
    |                                    |-- JJWT: ExpiredJwtException!
2.  |<-- HTTP 401 Unauthorized ----------| (Body: {code: "TOKEN_EXPIRED"})
    |                                    |
3.  |-- Axios Interceptor Catches 401   |
    |-- Pauses pending request queue     |
    |                                    |
4.  |--- POST /api/v1/auth/refresh ----->| (With HttpOnly Refresh Cookie)
    |                                    |-- Verify Refresh Token in DB/Redis
    |                                    |-- Issue New 15-min Access Token
5.  |<-- HTTP 200 { accessToken } -------|
    |                                    |
6.  |-- Update in-memory AuthContext     |
    |-- Update original request header   |
    |                                    |
7.  |--- Replay GET /transactions ------>| (With NEW Access Token)
    |<-- HTTP 200 OK [Transactions] -----|
8.  |-- User sees data with ZERO disruption!
```

**The Hard Expiry (Refresh Token Failure):**
If the user has been inactive for 7 days and the **refresh token itself has expired** or been revoked on the server:
1. `POST /api/v1/auth/refresh` fails with **HTTP 401/403**.
2. The Axios interceptor detects the permanent failure.
3. It clears all in-memory authentication state in `AuthContext`.
4. It redirects the browser to `/login` with an informational toast notification: *"Your session has expired. Please log in again to continue."*

**My Project Implementation:**
In VittSaathi, this complete lifecycle is implemented in `apiClient.js` using an **Axios Refresh Queue**:
- A mutex boolean `isRefreshing` prevents parallel 401 errors from firing multiple redundant refresh calls.
- In-flight requests queue their callbacks until the refresh resolves.

**Why I Used It:**
Silent token refreshing ensures that users never experience abrupt session lockouts while working, balancing short token security with seamless usability.

**Alternatives and Comparison:**

| Token Expiry Handling | User Experience | Security Posture |
| :--- | :--- | :--- |
| **Silent Refresh via Axios Interceptor (VittSaathi)**| **Seamless (Zero disruption to active user)**| **High (15-min short-lived access token)** |
| **Immediate Forced Logout on 401** | Terrible (User booted out every 15 min)| High |
| **Long-Lived Access Tokens (30 days)**| Convenient | **Critical Vulnerability (Stolen token valid 30 days)**|

**Interview-Ready Answer:**
"When an access token expires in VittSaathi, our application handles it transparently through an Axios response interceptor implementing a silent refresh workflow. When an API call returns HTTP 401, the interceptor pauses outgoing requests and sends a background request to `/api/v1/auth/refresh` using our HttpOnly refresh cookie. 
Spring Boot verifies the refresh token and returns a new 15-minute access token. The interceptor updates our in-memory token state, updates the Authorization header of the original failed request, and replays it automatically. The user never notices an interruption. If the refresh token itself has expired after 7 days, the interceptor clears memory and redirects the user to the login screen."

**Follow-up Depth:**
- *Cross-Question:* How does the Axios Refresh Queue prevent the **Thundering Herd** problem when 5 parallel API requests all fail with 401 at the exact same moment?
  - *Answer:* When multiple parallel requests (e.g., fetching accounts, budgets, and transactions) all receive a 401 simultaneously, we maintain an `isRefreshing` boolean flag and a `failedQueue` array. The first 401 sets `isRefreshing = true` and triggers the single refresh call. The other 4 concurrent requests push their resolve/reject promise callbacks into the `failedQueue` and pause. Once the refresh call resolves with the new token, the interceptor iterates over the `failedQueue`, replaying all 4 queued requests with the new token, and resets `isRefreshing = false`. This guarantees only one refresh request is ever sent to the server.
'''

if __name__ == '__main__':
    with open('vitt_sec15.md', 'w', encoding='utf-8') as f:
        f.write(get_sec15_text())
    print("Generated vitt_sec15.md successfully!")
