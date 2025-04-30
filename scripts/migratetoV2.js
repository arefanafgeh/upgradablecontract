const hrd = require('hardhat');
async function main(){
    const proxyAddress = "0x363D03F5Aa50716adA22597b62df4269616A942E";

    const Logic2 = await hrd.ethers.getContractFactory('LogicV2');
    const lv2contract = await Logic2.deploy();
    await lv2contract.waitForDeployment();

    const proxy = await hrd.ethers.getContractAt("Proxy",proxyAddress);
    const tx = await proxy.upgrade(await lv2contract.getAddress());
    await tx.wait();
    console.log("proxy upgraded");
}

main().catch((error)=>{
    console.error(error);
    process.exit(1);
})