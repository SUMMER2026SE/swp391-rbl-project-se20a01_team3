param(
    [Parameter(Mandatory=$true)][string]$InputDocx,
    [Parameter(Mandatory=$true)][string]$OutputPdf,
    [switch]$UpdateFields
)
$word = $null
$doc = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $doc = $word.Documents.Open((Resolve-Path -LiteralPath $InputDocx).Path, $false, $false)
    if ($UpdateFields) {
        foreach ($toc in $doc.TablesOfContents) { $toc.Update() | Out-Null }
        foreach ($story in $doc.StoryRanges) {
            $range = $story
            while ($null -ne $range) {
                $range.Fields.Update() | Out-Null
                $range = $range.NextStoryRange
            }
        }
        $doc.Save()
    }
    $pageCount = $doc.ComputeStatistics(2)
    $OutputPdf = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputPdf))
    $outDir = Split-Path -Parent $OutputPdf
    if ($outDir) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
    $doc.ExportAsFixedFormat($OutputPdf, 17)
    Write-Output "PAGES=$pageCount"
}
finally {
    if ($null -ne $doc) { $doc.Close($false) }
    if ($null -ne $word) { $word.Quit() }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
