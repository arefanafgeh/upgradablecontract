# Learn Upgradablity in smart contracts

Let’s dive into **contract upgradeability** in Solidity and Ethereum — from beginner to advanced — with clear examples and explanations.

---

## 🧠 Why Upgradeability?

Smart contracts on Ethereum are **immutable once deployed**. If you discover a bug, need to add new features, or upgrade logic — you're stuck.

**Upgradeability** lets you change contract logic **without losing**:

- User data
- Token balances
- Ownership info
- Contract address

---

## ⚙️ Common Use Case

- **ERC20 / ERC721 token contracts** that need governance upgrades
- **DeFi protocols** that evolve
- **DAOs** adding new modules

---

## 🟢 Basic Concepts

### 🔒 Logic vs Storage

In upgradeable architecture, you **separate**:
- **Logic (code)** — the part that may change
- **Storage (data)** — persistent user balances, ownership, config

---

## 🔁 Basic Pattern: Proxy + Logic Contracts

### Step-by-step architecture:

```
[User] ─┬──▶ [Proxy Contract] ───delegatecall──▶ [Logic Contract (V1)]
        │                                  ▲
        └── All reads/writes go to Proxy's storage
```

### 🧱 `delegatecall`

The `Proxy` uses `delegatecall` to run logic from the Logic contract **in its own storage context**.

---

## 🔄 Upgradeable Patterns

### 1. **Transparent Proxy Pattern** (most used)

Provided by [OpenZeppelin Upgrades Plugin](https://docs.openzeppelin.com/upgrades).

🧩 Structure:
- **Proxy contract**: permanent address
- **Implementation contract**: logic (can change)
- **Admin contract**: allowed to upgrade

Example Proxy:

```solidity
contract Proxy {
    address public implementation;

    function upgradeTo(address _newImplementation) public {
        implementation = _newImplementation;
    }

    fallback() external payable {
        address impl = implementation;
        require(impl != address(0), "No impl");
        (bool success, ) = impl.delegatecall(msg.data);
        require(success);
    }
}
```

⚠️ You should never write your own proxy; use audited ones from OpenZeppelin.

---

## 🚀 Using OpenZeppelin to Deploy Upgradeable Contracts

### 1. Install

```bash
npm install --save-dev @openzeppelin/hardhat-upgrades @openzeppelin/contracts
```

### 2. Write an Upgradeable Contract

```solidity
// contracts/MyToken.sol
// No constructor!
contract MyToken is Initializable {
    uint256 public value;

    function initialize(uint256 _value) public initializer {
        value = _value;
    }

    function setValue(uint256 _value) public {
        value = _value;
    }
}
```

### 3. Deploy with Hardhat

```js
// scripts/deploy.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const Token = await ethers.getContractFactory("MyToken");
  const proxy = await upgrades.deployProxy(Token, [42], {
    initializer: "initialize",
  });
  await proxy.waitForDeployment();
  console.log("Proxy deployed at:", await proxy.getAddress());
}
```

---

## 🔁 Upgrading to V2

```solidity
// contracts/MyTokenV2.sol
contract MyTokenV2 is MyToken {
    function increment() public {
        value += 1;
    }
}
```

```js
// scripts/upgrade.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const TokenV2 = await ethers.getContractFactory("MyTokenV2");
  const upgraded = await upgrades.upgradeProxy(
    "PROXY_ADDRESS_HERE",
    TokenV2
  );
  console.log("Upgraded!");
}
```

---

## ⚠️ Gotchas & Risks

### 1. **Storage layout must match**

You **cannot reorder** or remove storage variables. Only add at the end.

### 2. **No constructors**

Use `initialize()` instead (from `Initializable` contract).

### 3. **Storage collisions**

Use OpenZeppelin's tooling to avoid these.

---

## 🛠 Advanced Patterns

### 🔹 UUPS Proxy (more gas efficient)

- Proxy contains the upgrade logic.
- The implementation contract has an `upgradeTo()` function.
- More control, less gas, but higher responsibility.

### 🔹 Diamond Proxy (EIP-2535)

- Modular upgradeability.
- Multiple logic contracts called facets.
- Best for complex protocols like Uniswap or Aave.

---

## 📚 Summary

| Pattern              | Pros                             | Cons                              |
|----------------------|----------------------------------|-----------------------------------|
| Transparent Proxy    | Safe, audited, widely used       | Slightly more gas                 |
| UUPS Proxy           | Cheaper gas                      | Dev must secure upgrade logic     |
| Diamond Proxy        | Modular, powerful                | Complex implementation            |

---




--------------------------------------------------------------------
# Question
how to write a upgradalbe smart contract , deploy it , change it and deeply again (using hardhat ) all by myself with no help from openzeppelin?
--------------------------------------------------------------------

let me now break it **down properly**, step-by-step, with **clear explanations of every line**, what’s happening **under the hood**, and how **you control every aspect** of the upgradeable contract using **Hardhat only**, **no OpenZeppelin**.

---

## 🧠 Goal

Build your own upgradeable contract system using the **Transparent Proxy Pattern**, including:
- A storage-safe proxy.
- Logic contracts V1 and V2.
- Clear Hardhat deployment and upgrade scripts.

---

## ✅ What You’ll Learn Clearly

1. How the proxy delegates to logic.
2. How storage works.
3. Why you **shouldn't** use constructors.
4. How you deploy and interact with logic via proxy.
5. How to **upgrade the logic** without losing data.
6. How the fallback `delegatecall` works.

---

## 🔧 Step 1: Initialize Hardhat

```bash
mkdir upgradeable-from-scratch
cd upgradeable-from-scratch
npm init -y
npm install --save-dev hardhat
npx hardhat
```

Choose: **“Create a JavaScript project”**  
Install toolbox:

```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

---

## 🗂 Folder structure

```
contracts/
  Proxy.sol
  LogicV1.sol
  LogicV2.sol
scripts/
  deploy.js
  upgrade.js
```

---

## 📄 Step 2: Proxy Contract (very clearly explained)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Proxy {
    address public implementation;
    address public admin;

    constructor(address _impl) {
        implementation = _impl;
        admin = msg.sender;
    }

    function upgradeTo(address _newImpl) external {
        require(msg.sender == admin, "Not admin");
        implementation = _newImpl;
    }

    fallback() external payable {
        address impl = implementation;
        require(impl != address(0), "No implementation set");

        assembly {
            // Copy the calldata to memory starting at 0
            calldatacopy(0, 0, calldatasize())

            // Call the implementation with delegatecall
            let result := delegatecall(
                gas(),
                impl,
                0,
                calldatasize(),
                0,
                0
            )

            // Copy return data
            returndatacopy(0, 0, returndatasize())

            // Return or revert
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}
```

### 🔍 Key concepts:
- `delegatecall`: Executes code in another contract but **keeps storage of this (proxy) contract**.
- `fallback()`: Called when no function is matched — this delegates all logic calls to the implementation.
- `admin`: You can upgrade only if you're the admin.

---

## 📄 Step 3: LogicV1 Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LogicV1 {
    uint256 public x;

    function setX(uint256 _x) public {
        x = _x;
    }

    function getX() public view returns (uint256) {
        return x;
    }
}
```

💡 No constructor. Why? Because constructors don't work with `delegatecall`.  
If you need initialization, you should write an `initialize()` function.

---

## 📄 Step 4: LogicV2 Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LogicV2 {
    uint256 public x;

    function setX(uint256 _x) public {
        x = _x;
    }

    function getX() public view returns (uint256) {
        return x;
    }

    function doubleX() public {
        x *= 2;
    }
}
```

---

## 📜 Step 5: Deployment Script (deploy.js)

```js
const hre = require("hardhat");

async function main() {
  const LogicV1 = await hre.ethers.getContractFactory("LogicV1");
  const logicV1 = await LogicV1.deploy();
  await logicV1.waitForDeployment();
  console.log("LogicV1 deployed to:", await logicV1.getAddress());

  const Proxy = await hre.ethers.getContractFactory("Proxy");
  const proxy = await Proxy.deploy(await logicV1.getAddress());
  await proxy.waitForDeployment();
  console.log("Proxy deployed to:", await proxy.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

---

## 📜 Step 6: Interact with Proxy Using Logic ABI

```js
const hre = require("hardhat");

async function main() {
  const proxyAddress = "YOUR_PROXY_ADDRESS"; // <- fill this after deploy

  const LogicV1 = await hre.ethers.getContractFactory("LogicV1");
  const proxyAsLogic = LogicV1.attach(proxyAddress);

  await proxyAsLogic.setX(10);
  const result = await proxyAsLogic.getX();
  console.log("X is:", result.toString()); // Should print 10
}

main();
```

---

## 📜 Step 7: Upgrade Logic (upgrade.js)

```js
const hre = require("hardhat");

async function main() {
  const LogicV2 = await hre.ethers.getContractFactory("LogicV2");
  const logicV2 = await LogicV2.deploy();
  await logicV2.waitForDeployment();
  console.log("LogicV2 deployed at:", await logicV2.getAddress());

  const proxy = await hre.ethers.getContractAt("Proxy", "YOUR_PROXY_ADDRESS");

  const tx = await proxy.upgradeTo(await logicV2.getAddress());
  await tx.wait();
  console.log("Proxy upgraded");
}

main();
```

---

## 📜 Step 8: Use Upgraded Contract

```js
const hre = require("hardhat");

async function main() {
  const proxyAsLogicV2 = await hre.ethers.getContractAt("LogicV2", "YOUR_PROXY_ADDRESS");

  await proxyAsLogicV2.doubleX();
  const result = await proxyAsLogicV2.getX();
  console.log("After doubling X:", result.toString()); // Expect 20 if X was 10 before
}

main();
```

---

## 💡 Summary

- ✅ `Proxy.sol` handles storage.
- ✅ Logic contracts only hold code — no constructor, no storage.
- ✅ You `delegatecall` into logic from the proxy.
- ✅ You can upgrade logic and preserve state.
- ❌ You didn’t use OpenZeppelin. You wrote and controlled everything yourself.

---


--------------------------------------------------------------------
# Question
But Proxy does not have any remarkable state variable that we know using upgradablity , the storage from logic are seperated?
--------------------------------------------------------------------

and this is **exactly where most people get confused** when learning upgradeable contracts for the first time.

Let me break it down:

---

## 🔍 Proxy Contract **Does** Hold the State

Even though **you write variables in the Logic contract**, when the Proxy uses `delegatecall`, it **executes Logic code using the Proxy's storage**.

So yes — **the Proxy itself holds all the state variables**, not the Logic contract!

---

### ✅ Here's Why:

When you call a function through the proxy:

```solidity
proxy.setX(10);
```

- The `fallback()` function in the Proxy triggers.
- It does a `delegatecall` to `implementation.setX`.
- `delegatecall` executes the `Logic.setX()` **as if** it were inside the Proxy contract.
- So `x = 10` writes into **slot 0** of the Proxy’s storage — not Logic's.

Even though `LogicV1` declares `uint256 public x;`, that slot exists in the Proxy’s storage during a `delegatecall`.

---

### 📦 Real Storage Layout Example

Let’s say:

```solidity
contract LogicV1 {
    uint256 public x;         // Slot 0
}
```

And:

```solidity
contract Proxy {
    address public implementation; // Slot 0
    address public admin;          // Slot 1
}
```

Now there's a **problem**: both are using the same storage slots. That would **overwrite data**.

So, the proper proxy pattern (like OpenZeppelin's Transparent Proxy) **reserves the first few slots for the proxy** using a technique like this:

```solidity
bytes32 internal constant IMPLEMENTATION_SLOT = keccak256("proxy.implementation");
```

But in our simplified version, you're right — **we're not protecting storage layout**, so you need to be extremely careful.

---

### ✅ Upgrade Safety Rule:

If you control both the Proxy and Logic contracts yourself, **make sure you NEVER declare state variables in both** unless you're managing slot collisions.

---

## 🔁 TL;DR

- The **proxy holds all state**.
- The **logic holds only code**.
- `delegatecall` = run the code of Logic in the context of Proxy's storage.
- You must **align storage layout** between all versions of logic contracts.

---

--------------------------------------------------------------------
# Question
what if I had no idea if in the future , I wanted to add extra state variables to logic contract or not , and needed to store some state variable like owner address in the proxy contract? explain it to me deep with full smart contracts
--------------------------------------------------------------------

Great question. When designing upgradeable contracts, especially using a proxy pattern, managing **storage layout** is critical. Let me walk you through how to:

1. Store some variables in the proxy (like `owner`).
2. Ensure the logic contracts are upgradeable safely — even when you don’t yet know what variables you’ll add in the future.

We’ll use a **manually written Transparent Proxy Pattern** (no OpenZeppelin), and I’ll explain **storage collision**, **slot management**, and **future-proofing**.

---

### ⚙️ Key Concepts Recap

- **Proxy Contract**: Stores the state and delegates calls.
- **Logic Contract**: Contains the implementation logic (no actual state lives here, just function bodies).
- **Storage Collision**: When both proxy and logic store variables in the same slot — leading to bugs.

---

## ✅ Step-by-Step Implementation

---

### 🧱 Step 1: Proxy Contract — With an `owner` in storage

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MyProxy {
    address public owner; // stored at slot 0
    address public implementation; // stored at slot 1

    constructor(address _impl) {
        owner = msg.sender;
        implementation = _impl;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function upgradeTo(address newImplementation) external onlyOwner {
        implementation = newImplementation;
    }

    fallback() external payable {
        _delegate(implementation);
    }

    receive() external payable {
        _delegate(implementation);
    }

    function _delegate(address _impl) internal {
        assembly {
            calldatacopy(0, 0, calldatasize())

            let result := delegatecall(gas(), _impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())

            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}
```

- **`owner`** and **`implementation`** are stored in the proxy.
- The logic contract *must avoid using slot 0 and 1*, or you’ll have a storage collision.

---

### 🧠 Step 2: Logic Contract — Use reserved slots to avoid collision

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MyLogic {
    // Skip slots 0 and 1!
    // Use padding to avoid overlap
    uint256[2] private _gap; // occupies slot 0 and 1

    uint256 public counter; // stored at slot 2

    function increment() public {
        counter++;
    }

    function getCounter() public view returns (uint256) {
        return counter;
    }
}
```

- `uint256[2] _gap` takes slots 0 and 1 → logic will not collide with proxy variables.

---

### 📦 Step 3: Future Upgrades (Adding Variables)

Let’s say in version 2 you want to add a new state variable.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MyLogicV2 {
    uint256[2] private _gap; // still here to protect slots 0 & 1

    uint256 public counter; // slot 2
    string public newData;  // slot 3 — safe to add

    function increment() public {
        counter++;
    }

    function setNewData(string memory _val) public {
        newData = _val;
    }

    function getNewData() public view returns (string memory) {
        return newData;
    }
}
```

✔ You’ve avoided collision and **safely upgraded** your contract.

---

## 🛡 Best Practices

- Always **reserve slots** in the logic contract to protect storage used by the proxy.
- Use `_gap` or `uint256[50] private __gap;` in large projects to give room for future upgrades.
- Keep logic contracts stateless except for real application state.

---



--------------------------------------------------------------------
# Question
now teach me about Transparent Proxy Pattern step by step with example and tell me why and how is it different from writing my own upgradable proxy
--------------------------------------------------------------------

Great — let’s break down the Transparent Proxy Pattern in Solidity, step-by-step, with clear examples, and explain how it differs from writing your own upgradeable proxy from scratch.

---

## 🧠 What Is the Transparent Proxy Pattern?

The Transparent Proxy Pattern is an upgradeability pattern introduced by OpenZeppelin to:

* Prevent storage conflicts.
* Add clarity and safety in who can interact with the proxy contract.
* Separate upgrade logic from application logic using roles.

---

## 🧩 Components Involved

1. **Proxy Contract** – Forwards calls to the logic contract.
2. **Logic (Implementation) Contract** – Contains the business logic.
3. **Admin Role** – Can upgrade the contract but can’t call logic functions directly.
4. **Storage** – Maintained only in the Proxy.

---

## ⚙️ Key Features

| Feature                    | Transparent Proxy                 | Custom Proxy          |
| -------------------------- | --------------------------------- | --------------------- |
| Upgrade safety             | High – enforced roles             | Your responsibility   |
| Role separation            | Admin vs User                     | You must implement it |
| Prevents selector clashing | Yes (admin can’t use logic funcs) | You must handle it    |
| Library support            | Full (OpenZeppelin tooling)       | Minimal               |

---

## ✅ Step-by-Step Implementation Using Hardhat

Let’s create a transparent proxy manually (no OZ libraries).

---

### 1. Proxy Contract (Transparent)

```solidity
// contracts/Proxy.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Proxy {
    address public admin;
    address public implementation;

    constructor(address _impl) {
        admin = msg.sender;
        implementation = _impl;
    }

    function upgradeTo(address _newImpl) external {
        require(msg.sender == admin, "Only admin can upgrade");
        implementation = _newImpl;
    }

    fallback() external payable {
        address impl = implementation;
        require(impl != address(0), "No implementation");

        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())

            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    receive() external payable {}
}
```

---

### 2. Logic (Implementation) Contract

```solidity
// contracts/LogicV1.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LogicV1 {
    uint public value;

    function setValue(uint _value) public {
        value = _value;
    }
}
```

---

### 3. Logic V2 Contract

```solidity
// contracts/LogicV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LogicV2 {
    uint public value;

    function setValue(uint _value) public {
        value = _value * 2;
    }

    function getValue() public view returns (uint) {
        return value;
    }
}
```

---

### 4. Deploying via Hardhat

You’ll need to deploy `LogicV1` first, then `Proxy`, then interact via proxy address.

```js
// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const LogicV1 = await ethers.getContractFactory("LogicV1");
  const logicV1 = await LogicV1.deploy();
  await logicV1.deployed();

  const Proxy = await ethers.getContractFactory("Proxy");
  const proxy = await Proxy.deploy(logicV1.address);
  await proxy.deployed();

  console.log("LogicV1 deployed at:", logicV1.address);
  console.log("Proxy deployed at:", proxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

---

### 5. Interacting via Proxy

You interact using Logic ABI but proxy address:

```js
const proxyAsLogic = await ethers.getContractAt("LogicV1", proxy.address);
await proxyAsLogic.setValue(42);
console.log(await proxyAsLogic.value()); // 42
```

Then upgrade:

```js
const LogicV2 = await ethers.getContractFactory("LogicV2");
const logicV2 = await LogicV2.deploy();
await logicV2.deployed();

await proxy.upgradeTo(logicV2.address); // as admin
```

Now use LogicV2 ABI with proxy:

```js
const proxyAsLogicV2 = await ethers.getContractAt("LogicV2", proxy.address);
await proxyAsLogicV2.setValue(5);
console.log(await proxyAsLogicV2.getValue()); // 10
```

---

### ⚠️ Key Benefit of Transparent Proxy

If `admin` accidentally calls a function in the logic contract (via the proxy), it will **not be forwarded**. Instead, it reverts.

This prevents conflicts like:

```solidity
function upgradeTo(...) public onlyOwner
```

having the same selector as some other function like:

```solidity
function updateUser(...) public
```

---


--------------------------------------------------------------------
# Question
this was not clear  , I thought Transparent Proxy Pattern is somehow different than the prious fully self written upgradable contract...I saw no difference
--------------------------------------------------------------------

You're absolutely right to ask this — it's a subtle but **critical** distinction. Let me clarify:

---

## 🧠 The Core Idea: Why Transparent Proxy *Pattern* is Special

The **Transparent Proxy Pattern** is not just about writing a proxy — it’s about **access control + behavior separation**.

In a simple self-written proxy (like the one I showed before), **anyone** can call any function, and there is **no clear separation between upgrade logic and app logic** unless you write custom logic to handle it.

In contrast, the **Transparent Proxy Pattern strictly separates**:

* **Admin calls** (for upgrades only)
* **User calls** (for application logic only)

It **blocks the admin from calling app functions** via the proxy — to prevent:

* **Selector collisions**
* **Unintended upgrades or logic corruption**
* **Insecure delegation**

---

## 🧱 Breakdown of Transparent Proxy Pattern Components

1. **Proxy Contract** (with a fallback function)

   * Forwards only non-admin calls to the logic contract using `delegatecall`.
   * If the admin calls, it blocks fallback and allows only upgrade logic.

2. **Implementation Contract**

   * Business logic only (doesn't care about upgrades or proxy).

3. **Admin Restrictions**

   * The admin **cannot call normal logic functions** via proxy — it reverts.

---

## 🔁 Transparent Proxy vs Minimal Custom Proxy

| Feature                | Custom Proxy       | Transparent Proxy                 |
| ---------------------- | ------------------ | --------------------------------- |
| Upgrade access         | Admin logic needed | Built-in admin-only logic         |
| Admin can call logic?  | Yes, dangerous     | No, blocked                       |
| Safety from collisions | Low                | High                              |
| Based on standard?     | No                 | Yes (ERC1967)                     |
| Who uses it?           | DIY devs           | OpenZeppelin, Aave, Compound, etc |

---

## ✅ Transparent Proxy Example (from OpenZeppelin's real pattern)

Let’s write a simplified version of the **real** Transparent Proxy:

---

### 🔐 Transparent Proxy Contract

```solidity
// contracts/TransparentProxy.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TransparentProxy {
    address public admin;
    address public implementation;

    constructor(address _impl) {
        admin = msg.sender;
        implementation = _impl;
    }

    function upgradeTo(address _newImpl) external {
        require(msg.sender == admin, "Only admin");
        implementation = _newImpl;
    }

    fallback() external payable {
        if (msg.sender == admin) {
            revert("Admin cannot call logic functions");
        }

        address impl = implementation;
        require(impl != address(0), "No impl");

        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())

            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    receive() external payable {}
}
```

---

### 👥 Admin Behavior

If `admin` calls:

* `upgradeTo()` → ✅ allowed
* Any logic function (like `setValue()`) → ❌ blocked by `fallback()`

If a **user** calls:

* All logic functions → ✅ forwarded via `delegatecall`

---

### 🤯 Why This Is Critical

Imagine if the logic contract had:

```solidity
function setOwner(address newOwner) public {
    owner = newOwner;
}
```

If the admin accidentally calls this via the proxy in a **non-transparent** pattern — boom 💥 — the storage slot where `owner` is stored in proxy is overwritten. Totally unintended behavior.

---

### 🔐 Transparent Pattern = Safer Upgradeability

* Reduces human error.
* Separates concerns (upgrade vs logic).
* Matches OpenZeppelin’s audited pattern (ERC1967).

---



--------------------------------------------------------------------
# Question
now step by step teach me how to develop an upgradable contract using OpenZeppelin and hardhat
--------------------------------------------------------------------


