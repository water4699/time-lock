export const errorNotDeployed = (chainId: number | undefined) => {
  return (
    <div className="mx-auto p-8 bg-red-500/20 border-2 border-red-500 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Contract Not Deployed</h2>
      <p className="text-white">
        The StudySchedule contract is not deployed on chainId={chainId}.
      </p>
      <p className="text-white mt-2">
        Please deploy the contract first by running: <code className="bg-black/50 px-2 py-1 rounded">npx hardhat deploy --network localhost</code>
      </p>
    </div>
  );
};

