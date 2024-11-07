import * as Optuna from "@optuna/types"
import { useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useSnackbar } from "notistack"
import { useEffect } from "react"
import { useAPIClient } from "../apiClientProvider"

export const useParamImportance = ({
  numCompletedTrials,
  studyId,
  showPlot,
}: { numCompletedTrials: number; studyId: number, showPlot: boolean }) => {
  const { apiClient } = useAPIClient()
  const { enqueueSnackbar } = useSnackbar()

  const { data, isLoading, error } = useQuery<
    Optuna.ParamImportance[][],
    AxiosError<{ reason: string }>
  >({
    queryKey: ["paramImportance", studyId, numCompletedTrials, showPlot],
    queryFn: () => {
      // do not query for params importance in case we've loaded trials and we have completed trials
      // without this check, we would query for params importance before actual trials are loaded 
      // and right after it's loaded, which leads to two heavy requests
      if (!showPlot || numCompletedTrials === 0) {
        return Promise.resolve([]);
      }

      return apiClient.getParamImportances(studyId);
    },
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  useEffect(() => {
    if (error) {
      const reason = error.response?.data.reason
      enqueueSnackbar(
        `Failed to load hyperparameter importance (reason=${reason})`,
        {
          variant: "error",
        }
      )
    }
  }, [error])

  return {
    importances: data,
    isLoading,
    error,
  }
}
