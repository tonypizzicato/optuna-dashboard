import { Box, Card, CardContent, SvgIcon, useTheme } from "@mui/material"
import { HourglassTop } from "@mui/icons-material"

import * as plotly from "plotly.js-dist-min"
import React, { FC, useEffect, useState } from "react"

import { PlotImportance } from "@optuna/react"
import { StudyDetail } from "ts/types/optuna"
import { PlotType } from "../apiClient"
import { useParamImportance } from "../hooks/useParamImportance"
import { usePlot } from "../hooks/usePlot"
import { useBackendRender, usePlotlyColorTheme } from "../state"

const plotDomId = "graph-hyperparameter-importances"

export const GraphHyperparameterImportance: FC<{
  studyId: number
  study: StudyDetail | null
  graphHeight: string
}> = ({ studyId, study = null, graphHeight }) => {
  // show plot right away with a small number of trials
  const [showPlot, setShowPlot] = useState(study?.trials.length <= 1000)

  const numCompletedTrials =
    study?.trials.filter((t) => t.state === "Complete").length || 0
  const { importances, isLoading, error } = useParamImportance({
    numCompletedTrials,
    studyId,
    showPlot,
  })

  const theme = useTheme()
  const colorTheme = usePlotlyColorTheme(theme.palette.mode)
  const isBackend = useBackendRender();

  if (isLoading) {
    return (
      <Box component="div" sx={{ margin: theme.spacing(2) }}>
        <SvgIcon fontSize="small" color="action">
          <HourglassTop />
        </SvgIcon>
        Loading importances...
      </Box>
    );
  }

  if (!showPlot || error) {
    return (
      <button onClick={() => setShowPlot(!showPlot)}>Show plot</button>
    )
  }

  if (isBackend) {
    return (
      <GraphHyperparameterImportanceBackend
        studyId={studyId}
        study={study}
        graphHeight={graphHeight}
      />
    )
  } else {
    return (
      <Card>
        <CardContent>
          <PlotImportance
            study={study}
            importance={importances}
            graphHeight={graphHeight}
            colorTheme={colorTheme}
          />
        </CardContent>
      </Card>
    )
  }
}

const GraphHyperparameterImportanceBackend: FC<{
  studyId: number
  study: StudyDetail | null
  graphHeight: string
}> = ({ studyId, study = null, graphHeight }) => {
  const numCompletedTrials =
    study?.trials.filter((t) => t.state === "Complete").length || 0
  const { data, layout, error } = usePlot({
    numCompletedTrials,
    studyId,
    plotType: PlotType.ParamImportances,
  })

  useEffect(() => {
    if (data && layout) {
      plotly.react(plotDomId, data, layout)
    }
  }, [data, layout])
  useEffect(() => {
    if (error) {
      console.error(error)
    }
  }, [error])

  return <Box component="div" id={plotDomId} sx={{ height: graphHeight }} />
}
