# ✈️ SplitEase
**Travel Together, Split Better.**

SplitEase is a modern, collaborative expense-tracking web application designed for group trips. It features a sleek **Glassmorphism UI** and real-time synchronization to help friends manage shared costs without the awkward "who owes what" conversations.

---

## ✨ Features

* **Glassmorphism UI:** A stunning, frosted-glass interface with vibrant gradients and blur effects.
* **Trip Management:** Create trips, set group leaders, and invite friends.
* **Smart Splitting:** Add expenses with "Equal" or "Custom" split logic.
* **Real-time Chat:** Communicate with your travel squad directly within each trip.
* **Friend System:** Send and receive friend requests to build your travel network.
* **Live Balances:** View a simplified summary of net balances (who needs to pay and who needs to receive).
* **Expense Approval:** Trip leaders can approve or reject expenses to ensure transparency.

---

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite)
* **Styling:** Tailwind CSS (Backdrop Filter, Semi-transparent UI)
* **Backend/Database:** Firebase Firestore
* **Authentication:** Firebase Auth
* **Real-time:** Firebase Snapshots (for Chat)

---

## 🚀 Getting Started

### Prerequisites
* Node.js installed
* A Firebase project created at [console.firebase.google.com](https://console.firebase.google.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/snehagupta2611/ExpenseSplitter.git](https://github.com/snehagupta2611/ExpenseSplitter.git)
    cd ExpenseSplitter
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Firebase:**
    Update `src/firebase.js` with your Firebase project credentials:
    ```javascript
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT.firebaseapp.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT.firebasestorage.app",
      messagingSenderId: "YOUR_SENDER_ID",
      appId: "YOUR_APP_ID"
    };
    ```

4.  **Run the project:**
    ```bash
    npm run dev
    ```

---
