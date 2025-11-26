import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { StudySchedule, StudySchedule__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("StudySchedule")) as StudySchedule__factory;
  const studyScheduleContract = (await factory.deploy()) as StudySchedule;
  const studyScheduleContractAddress = await studyScheduleContract.getAddress();

  return { studyScheduleContract, studyScheduleContractAddress };
}

// Helper function to get start of day timestamp
function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp * 1000);
  date.setHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
}

describe("StudySchedule", function () {
  let signers: Signers;
  let studyScheduleContract: StudySchedule;
  let studyScheduleContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ studyScheduleContract, studyScheduleContractAddress } = await deployFixture());
  });

  it("should create a new schedule", async function () {
    const today = getStartOfDay(Math.floor(Date.now() / 1000));
    const targetGoals = 5;
    const completedGoals = 2;
    const priority = 2;

    // Encrypt values
    const allEncrypted = await fhevm
      .createEncryptedInput(studyScheduleContractAddress, signers.alice.address)
      .add32(targetGoals)
      .add32(completedGoals)
      .add32(priority)
      .encrypt();

    const tx = await studyScheduleContract
      .connect(signers.alice)
      .createOrUpdateSchedule(
        today,
        allEncrypted.handles[0],
        allEncrypted.handles[1],
        allEncrypted.handles[2],
        allEncrypted.inputProof
      );
    await tx.wait();

    // Verify schedule exists
    const exists = await studyScheduleContract.scheduleExists(signers.alice.address, today);
    expect(exists).to.be.true;

    // Get encrypted values
    const encryptedTargetGoals = await studyScheduleContract.getEncryptedTargetGoals(
      signers.alice.address,
      today
    );
    const encryptedCompletedGoals = await studyScheduleContract.getEncryptedCompletedGoals(
      signers.alice.address,
      today
    );

    // Decrypt and verify
    const clearTarget = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTargetGoals,
      studyScheduleContractAddress,
      signers.alice
    );

    const clearCompleted = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCompletedGoals,
      studyScheduleContractAddress,
      signers.alice
    );

    expect(clearTarget).to.eq(targetGoals);
    expect(clearCompleted).to.eq(completedGoals);
  });

  it("should calculate completion rate correctly", async function () {
    const today = getStartOfDay(Math.floor(Date.now() / 1000));
    const targetGoals = 10;
    const completedGoals = 7;
    const priority = 2;

    // Encrypt values
    const allEncrypted = await fhevm
      .createEncryptedInput(studyScheduleContractAddress, signers.alice.address)
      .add32(targetGoals)
      .add32(completedGoals)
      .add32(priority)
      .encrypt();

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

    // Get encrypted completion rate
    const encryptedCompletionRate = await studyScheduleContract.getEncryptedCompletionRate(
      signers.alice.address,
      today
    );

    // Decrypt completion rate
    const clearCompletionRate = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCompletionRate,
      studyScheduleContractAddress,
      signers.alice
    );

    // Expected: (7 * 100) / 10 = 70
    expect(clearCompletionRate).to.eq(70);
  });

  it("should calculate average priority correctly", async function () {
    const today = getStartOfDay(Math.floor(Date.now() / 1000));
    const targetGoals = 5;
    const completedGoals = 3;
    const priority = 2;

    // Encrypt values
    const allEncrypted = await fhevm
      .createEncryptedInput(studyScheduleContractAddress, signers.alice.address)
      .add32(targetGoals)
      .add32(completedGoals)
      .add32(priority)
      .encrypt();

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

    // Get encrypted average priority
    const encryptedAvgPriority = await studyScheduleContract.getEncryptedAveragePriority(
      signers.alice.address,
      today
    );

    // Decrypt average priority
    const clearAvgPriority = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedAvgPriority,
      studyScheduleContractAddress,
      signers.alice
    );

    // Expected: 2 / 1 = 2
    expect(clearAvgPriority).to.eq(2);
  });

  it("should update existing schedule", async function () {
    const today = getStartOfDay(Math.floor(Date.now() / 1000));
    
    // Create initial schedule
    const allEncrypted1 = await fhevm
      .createEncryptedInput(studyScheduleContractAddress, signers.alice.address)
      .add32(5)
      .add32(2)
      .add32(1)
      .encrypt();

    let tx = await studyScheduleContract
      .connect(signers.alice)
      .createOrUpdateSchedule(
        today,
        allEncrypted1.handles[0],
        allEncrypted1.handles[1],
        allEncrypted1.handles[2],
        allEncrypted1.inputProof
      );
    await tx.wait();

    // Update schedule
    const allEncrypted2 = await fhevm
      .createEncryptedInput(studyScheduleContractAddress, signers.alice.address)
      .add32(8)
      .add32(6)
      .add32(3)
      .encrypt();

    tx = await studyScheduleContract
      .connect(signers.alice)
      .createOrUpdateSchedule(
        today,
        allEncrypted2.handles[0],
        allEncrypted2.handles[1],
        allEncrypted2.handles[2],
        allEncrypted2.inputProof
      );
    await tx.wait();

    // Verify updated values
    const encryptedTarget = await studyScheduleContract.getEncryptedTargetGoals(
      signers.alice.address,
      today
    );
    const clearTarget = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTarget,
      studyScheduleContractAddress,
      signers.alice
    );

    expect(clearTarget).to.eq(8);
  });

  it("should allow users to view only their own schedules", async function () {
    const today = getStartOfDay(Math.floor(Date.now() / 1000));
    
    // Alice creates a schedule
    const aliceEncrypted = await fhevm
      .createEncryptedInput(studyScheduleContractAddress, signers.alice.address)
      .add32(5)
      .add32(3)
      .add32(2)
      .encrypt();

    let tx = await studyScheduleContract
      .connect(signers.alice)
      .createOrUpdateSchedule(
        today,
        aliceEncrypted.handles[0],
        aliceEncrypted.handles[1],
        aliceEncrypted.handles[2],
        aliceEncrypted.inputProof
      );
    await tx.wait();

    // Bob creates a schedule
    const bobEncrypted = await fhevm
      .createEncryptedInput(studyScheduleContractAddress, signers.bob.address)
      .add32(10)
      .add32(8)
      .add32(1)
      .encrypt();

    tx = await studyScheduleContract
      .connect(signers.bob)
      .createOrUpdateSchedule(
        today,
        bobEncrypted.handles[0],
        bobEncrypted.handles[1],
        bobEncrypted.handles[2],
        bobEncrypted.inputProof
      );
    await tx.wait();

    // Alice can only decrypt her own schedule
    const aliceTarget = await studyScheduleContract.getEncryptedTargetGoals(
      signers.alice.address,
      today
    );
    const aliceClear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      aliceTarget,
      studyScheduleContractAddress,
      signers.alice
    );
    expect(aliceClear).to.eq(5);

    // Bob can only decrypt his own schedule
    const bobTarget = await studyScheduleContract.getEncryptedTargetGoals(
      signers.bob.address,
      today
    );
    const bobClear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      bobTarget,
      studyScheduleContractAddress,
      signers.bob
    );
    expect(bobClear).to.eq(10);
  });

  it("should track user dates correctly", async function () {
    const today = getStartOfDay(Math.floor(Date.now() / 1000));
    const yesterday = today - 86400; // 24 hours ago

    // Create schedule for today
    const todayEncrypted = await fhevm
      .createEncryptedInput(studyScheduleContractAddress, signers.alice.address)
      .add32(5)
      .add32(3)
      .add32(2)
      .encrypt();

    let tx = await studyScheduleContract
      .connect(signers.alice)
      .createOrUpdateSchedule(
        today,
        todayEncrypted.handles[0],
        todayEncrypted.handles[1],
        todayEncrypted.handles[2],
        todayEncrypted.inputProof
      );
    await tx.wait();

    // Create schedule for yesterday
    const yesterdayEncrypted = await fhevm
      .createEncryptedInput(studyScheduleContractAddress, signers.alice.address)
      .add32(8)
      .add32(6)
      .add32(1)
      .encrypt();

    tx = await studyScheduleContract
      .connect(signers.alice)
      .createOrUpdateSchedule(
        yesterday,
        yesterdayEncrypted.handles[0],
        yesterdayEncrypted.handles[1],
        yesterdayEncrypted.handles[2],
        yesterdayEncrypted.inputProof
      );
    await tx.wait();

    // Verify user has 2 schedules
    const scheduleCount = await studyScheduleContract.getUserScheduleCount(signers.alice.address);
    expect(scheduleCount).to.eq(2);

    // Verify dates are tracked
    const dates = await studyScheduleContract.getUserDates(signers.alice.address);
    expect(dates.length).to.eq(2);
  });
});

