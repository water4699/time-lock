"use client";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useStudySchedule } from "@/hooks/useStudySchedule";
import { errorNotDeployed } from "./ErrorNotDeployed";
import { useState } from "react";
import { ScheduleForm } from "./ScheduleForm";
import { EncryptedDataDisplay } from "./EncryptedDataDisplay";
import { MessageDisplay } from "./MessageDisplay";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

export const StudyScheduleDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts: _accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [targetGoals, setTargetGoals] = useState<string>("5");
  const [completedGoals, setCompletedGoals] = useState<string>("3");
  const [priority, setPriority] = useState<string>("2");
  const [showDecrypted, setShowDecrypted] = useState(false);
  const [errors, setErrors] = useState<{
    targetGoals?: string;
    completedGoals?: string;
    priority?: string;
  }>({});

  const {
    instance: fhevmInstance,
    status: _fhevmStatus,
    error: _fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  // Temporary fix: if chainId is undefined but we're connected to localhost, assume chainId 31337
  const effectiveChainId = chainId || (isConnected && provider ? 31337 : undefined);

  const studySchedule = useStudySchedule({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId: effectiveChainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    let isValid = true;

    const targetNum = parseInt(targetGoals);
    const completedNum = parseInt(completedGoals);
    const priorityNum = parseInt(priority);

    if (isNaN(targetNum) || targetNum < 1) {
      newErrors.targetGoals = "Target goals must be at least 1";
      isValid = false;
    }

    if (isNaN(completedNum) || completedNum < 0) {
      newErrors.completedGoals = "Completed goals must be 0 or greater";
      isValid = false;
    }

    if (completedNum > targetNum) {
      newErrors.completedGoals = "Completed goals cannot exceed target goals";
      isValid = false;
    }

    if (isNaN(priorityNum) || priorityNum < 1 || priorityNum > 3) {
      newErrors.priority = "Priority must be between 1 and 3";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  if (!isConnected) {
    return (
      <div className="w-full flex justify-center items-center min-h-[60vh]">
        <Card variant="highlight" className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-white/70 mb-6">Please connect your wallet to start tracking your encrypted study schedule.</p>
          <Button
            variant="primary"
            size="lg"
            onClick={connect}
            className="w-full"
          >
            Connect Wallet
          </Button>
        </Card>
      </div>
    );
  }

  if (studySchedule.isDeployed === false) {
    return errorNotDeployed(chainId);
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);
    const timestamp = Math.floor(date.getTime() / 1000);

    try {
      await studySchedule.createOrUpdateSchedule(
        timestamp,
        parseInt(targetGoals),
        parseInt(completedGoals),
        parseInt(priority)
      );
      setShowDecrypted(false);
      setErrors({});
    } catch (error) {
      console.error("Submit failed:", error);
    }
  };

  const handleDecryptClick = async () => {
    try {
      const date = new Date(selectedDate);
      date.setHours(0, 0, 0, 0);
      const timestamp = Math.floor(date.getTime() / 1000);

      await studySchedule.decryptSchedule(timestamp);
      setShowDecrypted(true);
    } catch (error) {
      console.error("Decryption failed:", error);
    }
  };

  const handleRefresh = () => {
    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);
    const timestamp = Math.floor(date.getTime() / 1000);

    studySchedule.refreshSchedule(timestamp);
    setShowDecrypted(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-8">
      {/* Header */}
      <Card variant="highlight" className="text-center">
        <h1 className="font-bold text-3xl sm:text-4xl text-white mb-2">
          Encrypted Study Schedule
        </h1>
        <p className="text-white/70 text-sm sm:text-base">
          Track your daily study progress with fully encrypted, privacy-preserving data
        </p>
      </Card>

      {/* Input Section */}
      <ScheduleForm
        selectedDate={selectedDate}
        targetGoals={targetGoals}
        completedGoals={completedGoals}
        priority={priority}
        onDateChange={setSelectedDate}
        onTargetGoalsChange={setTargetGoals}
        onCompletedGoalsChange={setCompletedGoals}
        onPriorityChange={setPriority}
        errors={errors}
      />

      {/* Encrypted Data Display */}
      <EncryptedDataDisplay
        selectedDate={selectedDate}
        showDecrypted={showDecrypted}
        isRefreshing={studySchedule.isRefreshing}
        decryptedTargetGoals={studySchedule.decryptedTargetGoals}
        decryptedCompletedGoals={studySchedule.decryptedCompletedGoals}
        decryptedCompletionRate={studySchedule.decryptedCompletionRate}
        decryptedAvgPriority={studySchedule.decryptedAvgPriority}
        onRefresh={handleRefresh}
        onDecrypt={handleDecryptClick}
        onHide={() => setShowDecrypted(false)}
        canDecrypt={studySchedule.canDecrypt}
        isDecrypting={studySchedule.isDecrypting}
      />

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          variant="primary"
          size="lg"
          disabled={!studySchedule.canSubmit}
          onClick={handleSubmit}
          isLoading={studySchedule.isSubmitting}
          className="w-full"
        >
          {studySchedule.isSubmitting ? "Submitting..." : "Submit Schedule"}
        </Button>

        {showDecrypted ? (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowDecrypted(false)}
            className="w-full"
          >
            Hide Results
          </Button>
        ) : (
          <Button
            variant="success"
            size="lg"
            disabled={!studySchedule.canDecrypt}
            onClick={handleDecryptClick}
            isLoading={studySchedule.isDecrypting}
            className="w-full"
          >
            {studySchedule.isDecrypting ? "Decrypting..." : "Decrypt Data"}
          </Button>
        )}
      </div>

      {/* Message Display */}
      {studySchedule.message && (
        <MessageDisplay message={studySchedule.message} />
      )}
    </div>
  );
};
