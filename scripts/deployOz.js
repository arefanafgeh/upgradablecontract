const { ethers, upgrades } = require("hardhat");

async function main() {
  const CounterV1 = await ethers.getContractFactory("OzProxy");
  const proxy = await upgrades.deployProxy(CounterV1, [5], {
    initializer: "initialize",
  });
  await proxy.waitForDeployment();
  const address = await proxy.getAddress();
  console.log("✅ Proxy deployed at:", address);


  const implementationAddress = await upgrades.erc1967.getImplementationAddress(address);
    console.log("Implementation Address:", implementationAddress);



    const proxyAddress =address; // Replace with actual address


    const isERC1967 = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("Implementation Address:", isERC1967);

    const CounterV2 = await ethers.getContractFactory("OzProxy2");
    const upgraded = await upgrades.upgradeProxy(proxyAddress, CounterV2);

    console.log("✅ Upgraded to CounterV2");
}

main();