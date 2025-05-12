const { ethers, upgrades } = require("hardhat");

const {expect} = require("chai");
describe("manual Proxy test",function(){
    let Proxy, proxyInstance;
    let LogicV1, logicV1Instance;
    let LogicV2, logicV2Instance;
    let owner;
    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        // Deploy initial logic contract
        LogicV1 = await ethers.getContractFactory("OzProxy");
        proxy  = await upgrades.deployProxy(LogicV1 , [234], {
            initializer: "initialize",
          })
        await proxy.waitForDeployment();
        console.log("Proxy deployed at:", await proxy.getAddress());
       
    });

    it("Should set and get value via proxy", async function () {
        const proxyAsLogicV1 = await ethers.getContractAt("OzProxy",await proxy.getAddress());
        // console.log(await proxyAsLogicV1.interface.fragments);
        await proxyAsLogicV1.setVal(42);
        // console.error(await proxyAsLogicV1.x());
        expect(await proxyAsLogicV1.getVal()).to.equal(42);
        await proxyAsLogicV1.increament();
        expect(await proxyAsLogicV1.getVal()).to.equal(43);
    });

   it("Should upgrade to LogicV2 and retain state", async function () {
        // Deploy upgraded logic contract
        LogicV2 = await ethers.getContractFactory("OzProxy2");
        proxyAsLogicV1= await upgrades.upgradeProxy(await proxy.getAddress(), LogicV2);

       await proxyAsLogicV1.setVal(42);
        // Verify state persists
        expect(await proxyAsLogicV1.getVal()).to.equal(42);

        await proxyAsLogicV1.increament();
        expect(await proxyAsLogicV1.getVal()).to.equal(53);
    });

})



 