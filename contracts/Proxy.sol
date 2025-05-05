// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Proxy {
    address public implementation;
    address public owner;

    constructor(address _impl) {
        implementation = _impl;
        owner = msg.sender;
    }

    modifier onlyOnwer(){
        require(msg.sender==owner , "Not owner , get the fuck out of here");
        _;
    }

    function upgrade(address _newimpl) external onlyOnwer {
        implementation = _newimpl;
    }

    fallback() external payable {
        address impl  =implementation;
        require(impl!=address(0),'No implementation , WTF are you doing man?!');
        if (msg.sender == owner) {
            revert("Admin cannot call logic functions");
        }

        assembly{
            calldatacopy(0,0,calldatasize())
            let result := delegatecall(gas(),impl,0,calldatasize(),0,0)
            returndatacopy(0,0,returndatasize())

            switch result
            case 0 {revert(0 , returndatasize())}
            case 1 {return(0 , returndatasize())}
        }
    }
}
