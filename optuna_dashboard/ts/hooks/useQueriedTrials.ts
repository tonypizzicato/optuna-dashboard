import * as Optuna from "@optuna/types"
import { useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useSnackbar } from "notistack"
import { useEffect } from "react"
import { useAPIClient } from "../apiClientProvider"


export const useQueriedTrials = (studyId: number, trials: Optuna.Trial[], query: URLSearchParams) => {
  const { apiClient } = useAPIClient()
  const { enqueueSnackbar } = useSnackbar()

  const { data, isLoading, error } = useQuery<Optuna.Trial[], AxiosError<{ reason: string }>>({
    queryKey: ["trial", studyId, trials.length, query.get("numbers")],
    queryFn: () => {
      if (!studyId) {
        return Promise.resolve([])
      }

      const queried = query.get("numbers")
      if (queried === null) {
        return Promise.resolve([])
      }
      const numbers = queried
        .split(",")
        .map(s => parseInt(s))
        .filter(n => !isNaN(n))

      if (numbers.length === 0) {
        return Promise.resolve([])
      }

      const filtered = trials.filter(t => numbers.findIndex(n => n === t.number) !== -1)

      return Promise.all(filtered.map(t => apiClient.getTrialDetail(studyId, t.trial_id)))
    },
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  useEffect(() => {
    if (error) {
      const reason = error.response?.data.reason
      enqueueSnackbar(`Failed to load trials (reason=${reason})`, {
        variant: "error",
      })
    }
  }, [error])

  return {
    trials: data,
    isLoading,
    error,
  }
}
