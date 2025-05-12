// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract OzProxy2 is Initializable {
    uint256 public val;
    address public owner;

    function initialize(uint256 _val) public initializer{
        val = _val;
        owner = msg.sender;
    }

    function setVal(uint256 _val) public{
        val = _val;
    }
    function getVal() public view returns (uint256){
        return val;
    }
    function increament() public{
        val+=11;
    }
}