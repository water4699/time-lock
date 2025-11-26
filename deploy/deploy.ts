import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedStudySchedule = await deploy("StudySchedule", {
    from: deployer,
    log: true,
  });

  console.log(`StudySchedule contract: `, deployedStudySchedule.address);
};
export default func;
func.id = "deploy_studySchedule"; // id required to prevent reexecution
func.tags = ["StudySchedule"];

