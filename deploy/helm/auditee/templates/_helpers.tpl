{{/*
Common helpers for the Auditee chart.
*/}}

{{- define "auditee.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "auditee.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "auditee.api.fullname" -}}
{{- printf "%s-api" (include "auditee.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "auditee.web.fullname" -}}
{{- printf "%s-web" (include "auditee.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "auditee.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/name: {{ include "auditee.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "auditee.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "auditee.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}
