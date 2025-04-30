const hrd = require('hardhat');
async function main(){
    const Logic1 = await hrd.ethers.getContractFactory('LogicV1');
    const lv1contract = await Logic1.deploy();
    await lv1contract.waitForDeployment();

    const proxy = await hrd.ethers.getContractFactory("Proxy");
    const proxycon = await proxy.deploy(await lv1contract.getAddress());
    await proxycon.waitForDeployment();
    console.log(await proxycon.getAddress());
}

main().catch((error)=>{
    console.error(error);
    process.exit(1);
})