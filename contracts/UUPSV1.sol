// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract UUPSV1 is Initializable , UUPSUpgradeable , OwnableUpgradeable{

    uint256 x;

    // constructor(){
    //     _disableInitializers();
    // }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    function getValue() public view returns (uint256) {
        return x;
    }

    function setValue(uint256 _value) public {
        x = _value;
    }

    function double() public {
        x = x * 2;
    }
}