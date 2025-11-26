import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { StudySchedule } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("StudyScheduleSepolia", function () {
  let signers: Signers;
  let studyScheduleContract: StudySchedule;
  let studyScheduleContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  // Helper function to get start of day timestamp
  function getStartOfDay(timestamp: number): number {
    const date = new Date(timestamp * 1000);
    date.setHours(0, 0, 0, 0);
    return Math.floor(date.getTime() / 1000);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const StudyScheduleDeployment = await deployments.get("StudySchedule");
      studyScheduleContractAddress = StudyScheduleDeployment.address;
      studyScheduleContract = await ethers.getContractAt(
        "StudySchedule",
        StudyScheduleDeployment.address
      );
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should create a schedule and calculate completion rate", async function () {
    steps = 15;

    this.timeout(4 * 40000);

    const today = getStartOfDay(Math.floor(Date.now() / 1000));
    const targetGoals = 10;
    const completedGoals = 7;
    const priority = 2;

    progress("Encrypting target goals...");
    const encryptedTarget = await fhevm
      .createEncryptedInput(studyScheduleContractAddress, signers.alice.address)
      .add32(targetGoals)
      .encrypt();

    progress("Encrypting completed goals...");
    const encryptedCompleted = await fhevm
      .createEncryptedInput(studyScheduleContractAddress, signers.alice.address)
      .add32(completedGoals)
      .encrypt();

    progress("Encrypting priority...");
    const encryptedPriority = await fhevm
      .createEncryptedInput(studyScheduleContractAddress, signers.alice.address)
      .add32(priority)
      .encrypt();

    progress("Combining encrypted inputs...");
    const allEncrypted = await fhevm
      .createEncryptedInput(studyScheduleContractAddress, signers.alice.address)
      .add32(targetGoals)
      .add32(completedGoals)
      .add32(priority)
      .encrypt();

    progress(
      `Call createOrUpdateSchedule StudySchedule=${studyScheduleContractAddress} date=${today} signer=${signers.alice.address}...`
    );
    let tx = await studyScheduleContract
      .connect(signers.alice)
      .createOrUpdateSchedule(
        today,
        allEncrypted.handles[0],
        allEncrypted.handles[1],
        allEncrypted.handles[2],
        allEncrypted.inputProof
      );
    await tx.wait();

    progress("Verifying schedule exists...");
    const exists = await studyScheduleContract.scheduleExists(signers.alice.address, today);
    expect(exists).to.be.true;

    progress("Getting encrypted target goals...");
    const encryptedTargetGoals = await studyScheduleContract.getEncryptedTargetGoals(
      signers.alice.address,
      today
    );
    expect(encryptedTargetGoals).to.not.eq(ethers.ZeroHash);

    progress("Decrypting target goals...");
    const clearTarget = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTargetGoals,
      studyScheduleContractAddress,
      signers.alice
    );
    progress(`Clear target goals=${clearTarget}`);
    expect(clearTarget).to.eq(targetGoals);

    progress("Getting encrypted completion rate...");
    const encryptedCompletionRate = await studyScheduleContract.getEncryptedCompletionRate(
      signers.alice.address,
      today
    );

    progress("Decrypting completion rate...");
    const clearCompletionRate = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCompletionRate,
      studyScheduleContractAddress,
      signers.alice
    );
    progress(`Clear completion rate=${clearCompletionRate}%`);

    // Expected: (7 * 100) / 10 = 70
    expect(clearCompletionRate).to.eq(70);

    progress("Getting encrypted average priority...");
    const encryptedAvgPriority = await studyScheduleContract.getEncryptedAveragePriority(
      signers.alice.address,
      today
    );

    progress("Decrypting average priority...");
    const clearAvgPriority = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedAvgPriority,
      studyScheduleContractAddress,
      signers.alice
    );
    progress(`Clear average priority=${clearAvgPriority}`);

    // Expected: 2 / 1 = 2
    expect(clearAvgPriority).to.eq(2);
  });
});

