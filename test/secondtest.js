const { ethers, upgrades } = require("hardhat");

const {expect} = require("chai");
describe("manual Proxy test",function(){
    let LogicV1, logicV1Instance;
    let LogicV2, logicV2Instance;
    let owner;
    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        // Deploy initial logic contract
        LogicV1 = await ethers.getContractFactory("LogicV1");
        logicV1Instance = await LogicV1.deploy();
        await logicV1Instance.waitForDeployment();
        console.log("LogicV1 deployed at:", await logicV1Instance.getAddress());
        // Deploy proxy contract with LogicV1's address
        Proxy = await ethers.getContractFactory("Proxy");
        proxyInstance = await Proxy.deploy(await logicV1Instance.getAddress());
        await proxyInstance.waitForDeployment();
        console.log("Proxy deployed at:",await proxyInstance.getAddress());
    });

    it("Should set and get value via proxy", async function () {
        const proxyAsLogicV1 = await ethers.getContractAt("LogicV1",await proxyInstance.getAddress());
        // console.log(await proxyAsLogicV1.interface.fragments);
        await proxyAsLogicV1.setX(42);
        // console.error(await proxyAsLogicV1.x());
        expect(await proxyAsLogicV1.x()).to.equal(42);
        await proxyAsLogicV1.increament();
        expect(await proxyAsLogicV1.x()).to.equal(43);
    });

   it("Should upgrade to LogicV2 and retain state", async function () {
        // Deploy upgraded logic contract
        LogicV2 = await ethers.getContractFactory("LogicV2");
        logicV2Instance = await LogicV2.deploy();
        await logicV2Instance.waitForDeployment();

        // Upgrade proxy to use LogicV2
        await proxyInstance.upgrade(await logicV2Instance.getAddress());

        // Attach proxy to new LogicV2 ABI
        const proxyAsLogicV2 = await ethers.getContractAt("LogicV2",await proxyInstance.getAddress());
        await proxyAsLogicV2.setX(42);
        // Verify state persists
        expect(await proxyAsLogicV2.x()).to.equal(42);

        await proxyAsLogicV2.increament();
        expect(await proxyAsLogicV2.x()).to.equal(52);
    });

})



 