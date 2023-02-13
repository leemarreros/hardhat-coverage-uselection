import { USElection__factory } from "./../typechain-types/factories/Election.sol/USElection__factory";
import { USElection } from "./../typechain-types/Election.sol/USElection";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("USElection", function () {
  let usElectionFactory;
  let usElection: USElection;

  before(async () => {
    usElectionFactory = await ethers.getContractFactory("USElection");

    usElection = await usElectionFactory.deploy();

    await usElection.deployed();
  });

  it("Should return the current leader before submit any election results", async function () {
    expect(await usElection.currentLeader()).to.equal(0); // NOBODY
  });

  it("Should return the election status", async function () {
    expect(await usElection.electionEnded()).to.equal(false); // Not Ended
  });

  it("Only the owner could trigger the election process", async function () {
    var [owner, addr1] = await ethers.getSigners();

    const stateResults = ["California", 1000, 900, 32];
    await expect(usElection.connect(addr1).submitStateResult(
      stateResults
    )).to.be.revertedWith("Not invoked by the owner")
  })

  it("States must have at least 1 seat", async function () {
    const stateResults = ["California", 1000, 900, 0];
    await expect(usElection.submitStateResult(
      stateResults
    )).to.be.revertedWith("States must have at least 1 seat")
  })

  it("There cannot be a tie", async function () {
    const stateResults = ["California", 300, 300, 100];
    await expect(usElection.submitStateResult(
      stateResults
    )).to.be.revertedWith("There cannot be a tie")
  })

  it("Should submit state results and get current leader", async function () {
    const stateResults = ["California", 1000, 900, 32];

    const submitStateResultsTx = await usElection.submitStateResult(
      stateResults
    );

    await submitStateResultsTx.wait();

    expect(await usElection.currentLeader()).to.equal(1); // BIDEN
  });

  it("Should throw when try to submit already submitted state results", async function () {
    const stateResults = ["California", 1000, 900, 32];

    expect(usElection.submitStateResult(stateResults)).to.be.revertedWith(
      "This state result was already submitted!"
    );
  });

  it("Should submit state results and get current leader", async function () {
    const stateResults = ["Ohaio", 800, 1200, 33];

    const submitStateResultsTx = await usElection.submitStateResult(
      stateResults
    );

    await submitStateResultsTx.wait();

    expect(await usElection.currentLeader()).to.equal(2); // TRUMP
  });

  it("Election is finished only by the owner", async function () {
    var [owner, addr1] = await ethers.getSigners();
    await expect(usElection.connect(addr1).endElection()).to.be.revertedWith("Not invoked by the owner");
  })

  it("Should end the elections, get the leader and election status", async function () {
    const endElectionTx = await usElection.endElection();

    await endElectionTx.wait();

    expect(await usElection.currentLeader()).to.equal(2); // TRUMP

    expect(await usElection.electionEnded()).to.equal(true); // Ended
  });

  it("Cannot submit state results after election has ended", async function () {
    const stateResults = ["Ohaio", 800, 1200, 33];

    await expect(usElection.submitStateResult(
      stateResults
    )).to.be.revertedWith("The election has ended already")
  })

  it("Election is finished only when election is active", async function () {
    await expect(usElection.endElection()).to.be.revertedWith("The election has ended already");
  })
});
