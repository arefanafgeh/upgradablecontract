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
