"use client";

import { Eye, EyeOff, Lock, RefreshCw, TrendingUp, Target, CheckCircle2, Star } from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { ProgressBar } from "./ProgressBar";

interface EncryptedDataDisplayProps {
  selectedDate: string;
  showDecrypted: boolean;
  isRefreshing: boolean;
  decryptedTargetGoals?: string | bigint | boolean;
  decryptedCompletedGoals?: string | bigint | boolean;
  decryptedCompletionRate?: string | bigint | boolean;
  decryptedAvgPriority?: string | bigint | boolean;
  onRefresh: () => void;
  onDecrypt: () => void;
  onHide: () => void;
  canDecrypt: boolean;
  isDecrypting: boolean;
}

export function EncryptedDataDisplay({
  selectedDate,
  showDecrypted,
  isRefreshing,
  decryptedTargetGoals,
  decryptedCompletedGoals,
  decryptedCompletionRate,
  decryptedAvgPriority,
  onRefresh,
  onDecrypt,
  onHide,
  canDecrypt,
  isDecrypting,
}: EncryptedDataDisplayProps) {
  const completionRate = decryptedCompletionRate
    ? typeof decryptedCompletionRate === "bigint"
      ? Number(decryptedCompletionRate)
      : Number(decryptedCompletionRate)
    : undefined;

  const targetGoalsNum = decryptedTargetGoals
    ? typeof decryptedTargetGoals === "bigint"
      ? Number(decryptedTargetGoals)
      : Number(decryptedTargetGoals)
    : undefined;

  const completedGoalsNum = decryptedCompletedGoals
    ? typeof decryptedCompletedGoals === "bigint"
      ? Number(decryptedCompletedGoals)
      : Number(decryptedCompletedGoals)
    : undefined;

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-gray-300" />
          <span className="font-semibold text-white text-xl">Encrypted Study Data</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          isLoading={isRefreshing}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/60">Date:</span>
              <span className="ml-2 text-white font-mono font-medium">{selectedDate}</span>
            </div>
            <div>
              <span className="text-white/60">Status:</span>
              <span className="ml-2 text-green-400 font-medium">Encrypted</span>
            </div>
          </div>
        </div>

        {showDecrypted && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-700/40 rounded-lg p-6 border border-gray-500/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-white text-lg">Decrypted Results</span>
                </div>
                <Button variant="ghost" size="sm" onClick={onHide}>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {targetGoalsNum !== undefined && (
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-gray-300" />
                      <span className="text-sm text-gray-200 font-medium">Target Goals</span>
                    </div>
                    <span className="text-3xl font-bold text-white">{targetGoalsNum}</span>
                  </div>
                )}

                {completedGoalsNum !== undefined && (
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-300 font-medium">Completed Goals</span>
                    </div>
                    <span className="text-3xl font-bold text-white">{completedGoalsNum}</span>
                  </div>
                )}

                {completionRate !== undefined && (
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-blue-300 font-medium">Completion Rate</span>
                    </div>
                    <span className="text-3xl font-bold text-white">{completionRate.toFixed(1)}%</span>
                    <ProgressBar value={completionRate} className="mt-3" />
                  </div>
                )}

                {decryptedAvgPriority !== undefined && (
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-yellow-300 font-medium">Avg Priority</span>
                    </div>
                    <span className="text-3xl font-bold text-white">
                      {typeof decryptedAvgPriority === "bigint"
                        ? Number(decryptedAvgPriority).toFixed(1)
                        : Number(decryptedAvgPriority).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!showDecrypted && (
          <div className="bg-white/5 rounded-lg p-6 border border-white/10 text-center">
            <div className="flex flex-col items-center gap-3 text-white/60">
              <EyeOff className="w-8 h-8" />
              <p>Data is encrypted. Click decrypt to view your results.</p>
              <Button
                variant="success"
                onClick={onDecrypt}
                disabled={!canDecrypt}
                isLoading={isDecrypting}
                className="mt-2"
              >
                <Eye className="w-4 h-4 mr-2" />
                Decrypt Data
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

