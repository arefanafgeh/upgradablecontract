// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract LogicV1 {

    uint256 public _gap;
    uint256 public _gap2;

    uint256 public x;

    function setX(uint256 _x) public {
        x=_x;
    }

    function getX(uint256 _x) public view returns(uint256){
        return x;
    }

    function increament() public {
        x+=1;
    }
}