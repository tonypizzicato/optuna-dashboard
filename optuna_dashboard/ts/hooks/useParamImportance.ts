import { useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useSnackbar } from "notistack"
import { useEffect } from "react"
import { ParamImportance } from "ts/types/optuna"
import { getParamImportances } from "../apiClient"

export const useParamImportance = ({
  numCompletedTrials,
  studyId,
}: { numCompletedTrials: number; studyId: number }) => {
  const { enqueueSnackbar } = useSnackbar()

  const { data, isLoading, error } = useQuery<
    ParamImportance[][],
    AxiosError<{ reason: string }>
  >({
    queryKey: ["paramImportance", studyId, numCompletedTrials],
    queryFn: () => getParamImportances(studyId),
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
