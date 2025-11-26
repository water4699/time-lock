import { task } from "hardhat/config";

task("studySchedule", "Interact with StudySchedule contract")
  .addParam("action", "Action to perform: deploy, get, create")
  .addOptionalParam("date", "Date timestamp (for get/create actions)")
  .addOptionalParam("target", "Target goals (for create action)")
  .addOptionalParam("completed", "Completed goals (for create action)")
  .addOptionalParam("priority", "Priority (1-3) (for create action)")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const { action, date, target, completed, priority } = taskArgs;

    if (action === "deploy") {
      const StudySchedule = await ethers.getContractFactory("StudySchedule");
      const studySchedule = await StudySchedule.deploy();
      await studySchedule.waitForDeployment();
      const address = await studySchedule.getAddress();
      console.log(`StudySchedule deployed to: ${address}`);
    } else {
      console.log("Use the frontend to interact with the contract");
    }
  });

