$ErrorActionPreference = "Stop"

$root = Join-Path $PSScriptRoot ".."
$reviewDir = Join-Path $root "review"
New-Item -ItemType Directory -Force -Path $reviewDir | Out-Null

$targets = @(
  @{ Path = "data\vocab_junior.json"; Label = "Sean 會考"; Stage = "junior" },
  @{ Path = "data\vocab_gsat.json"; Label = "Ray 學測"; Stage = "gsat" }
)

$phraseWords = @("a", "an", "the", "of", "to", "in", "on", "at", "for", "with", "by", "from", "up", "out", "off", "over", "under", "as", "well", "lot", "kind", "part")
$grammarTerms = @{
  adjective = @{ pos = @("noun"); meaning = "形容詞" }
  adverb = @{ pos = @("noun"); meaning = "副詞" }
  noun = @{ pos = @("noun"); meaning = "名詞" }
  verb = @{ pos = @("noun"); meaning = "動詞" }
  preposition = @{ pos = @("noun"); meaning = "介系詞" }
  conjunction = @{ pos = @("noun"); meaning = "連接詞" }
  pronoun = @{ pos = @("noun"); meaning = "代名詞" }
}

function Set-Prop($obj, [string]$name, $value) {
  if ($obj.PSObject.Properties[$name]) {
    $obj.$name = $value
  } else {
    $obj | Add-Member -NotePropertyName $name -NotePropertyValue $value -Force
  }
}

function MeaningOf($item) {
  if ($item.PSObject.Properties["meaningZh"] -and $item.meaningZh) { return [string]$item.meaningZh }
  return [string]$item.chinese
}

function Is-Phrase($item) {
  return @($item.part_of_speech) -contains "phrase"
}

function Is-SuspiciousSpaceWord($word, $item) {
  if ($word -notmatch "\s") { return $false }
  if (Is-Phrase $item) { return $false }
  $tokens = @($word.ToLowerInvariant() -split "\s+" | Where-Object { $_ })
  if ($tokens.Count -lt 2) { return $false }
  $hasPhraseToken = @($tokens | Where-Object { $phraseWords -contains $_ }).Count -gt 0
  if ($hasPhraseToken) { return $false }
  return $true
}

function Has-BaseIngCollision($word) {
  $tokens = @($word.ToLowerInvariant() -split "\s+" | Where-Object { $_ })
  foreach ($token in $tokens) {
    if ($token -match "ing$") {
      $base = $token -replace "ing$", ""
      if ($tokens -contains $base) { return $true }
      if ($token -match "ying$" -and ($tokens -contains (($token -replace "ying$", "ie")))) { return $true }
    }
  }
  return $false
}

function Has-RepeatedToken($word) {
  $tokens = @($word.ToLowerInvariant() -split "\s+" | Where-Object { $_ })
  return $tokens.Count -gt (@($tokens | Select-Object -Unique)).Count
}

function Clear-QualityMarks($item) {
  $hadQualityMark = $item.PSObject.Properties["quality_review_status"] -ne $null
  foreach ($name in @("quality_review_status", "quality_issues", "quality_suggestion", "suggested_part_of_speech", "suggested_meaningZh")) {
    if ($item.PSObject.Properties[$name]) { $item.PSObject.Properties.Remove($name) }
  }
  if ($hadQualityMark -and $item.PSObject.Properties["practiceReady"] -and $item.practiceReady -eq $false) {
    $item.PSObject.Properties.Remove("practiceReady")
  }
  if ($hadQualityMark -and $item.PSObject.Properties["review_status"] -and $item.review_status -eq "needs_review") {
    $item.PSObject.Properties.Remove("review_status")
  }
}

function Is-OverlongJuniorMeaning($item) {
  $meaning = MeaningOf $item
  if (-not $meaning) { return $false }
  return $meaning.Length -ge 34 -or ([regex]::Matches($meaning, "、|；|;|,")).Count -ge 5
}

$reviewItems = @()
$summary = @()

foreach ($target in $targets) {
  $path = Join-Path $root $target.Path
  $data = Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json
  $blocked = 0
  $needsReview = 0
  $autoFixed = 0

  foreach ($item in @($data)) {
    Clear-QualityMarks $item
    $word = ([string]$item.word).Trim()
    $lower = $word.ToLowerInvariant()
    $issues = @()
    $severity = "review"
    $suggestion = ""

    if (Is-SuspiciousSpaceWord $word $item) {
      $issues += "單字含空格但不是片語"
      $severity = "review"
    }
    if (Has-BaseIngCollision $word) {
      $issues += "疑似原形與 V-ing 被拼接"
      $severity = "block"
    }
    if ((Has-RepeatedToken $word) -and -not (Is-Phrase $item)) {
      $issues += "疑似重複詞"
      $severity = "block"
    }
    if ($lower -match "\bxxx\b") {
      $issues += "含占位符 xxx，疑似未清理資料"
      $severity = "block"
    }
    if ($grammarTerms.ContainsKey($lower)) {
      $expected = $grammarTerms[$lower]
      if (-not (@($item.part_of_speech) -contains "noun") -or (MeaningOf $item) -match "的$") {
        $issues += "文法術語詞性或中文釋義需要統一"
        $suggestion = "建議改為：$word / n. / $($expected.meaning)"
      }
    }
    if ($target.Stage -eq "junior" -and (Is-OverlongJuniorMeaning $item)) {
      $issues += "會考階段中文釋義過長"
      if (-not $suggestion) { $suggestion = "建議保留 1-2 個會考常用義即可" }
    }

    if ($issues.Count -gt 0) {
      Set-Prop $item "quality_review_status" "needs_review"
      Set-Prop $item "quality_issues" $issues
      Set-Prop $item "quality_suggestion" $suggestion
      $needsReview++

      if ($severity -eq "block") {
        Set-Prop $item "practiceReady" $false
        Set-Prop $item "review_status" "needs_review"
        $blocked++
      }

      if ($lower -eq "adjective") {
        Set-Prop $item "suggested_part_of_speech" @("noun")
        Set-Prop $item "suggested_meaningZh" "形容詞"
      }

      $reviewItems += [pscustomobject]@{
        learner = $target.Label
        file = $target.Path
        id = $item.id
        word = $item.word
        part_of_speech = $item.part_of_speech
        meaning = MeaningOf $item
        issues = $issues
        severity = $severity
        suggestion = $suggestion
        practiceReady = $item.practiceReady
      }
    }
  }

  Set-Content -LiteralPath $path -Value ($data | ConvertTo-Json -Depth 40) -Encoding UTF8
  $summary += [pscustomobject]@{
    learner = $target.Label
    total_words = @($data).Count
    blocked_from_practice = $blocked
    needs_quality_review = $needsReview
    auto_fixed = $autoFixed
  }
}

$jsonPath = Join-Path $reviewDir "vocab-quality-review.json"
Set-Content -LiteralPath $jsonPath -Value ($reviewItems | ConvertTo-Json -Depth 20) -Encoding UTF8

$mdPath = Join-Path $reviewDir "vocab-quality-review.md"
$lines = @()
$lines += "# 單字詞庫品質待審核清單"
$lines += ""
$lines += "本清單處理三類問題：脏資料、過長釋義、詞性標註異常。嚴重脏資料已先排除出正式單字練習。"
$lines += ""
$lines += "## 摘要"
$lines += ""
$lines += "| 學習者 | 單字量 | 已排除正式練習 | 待品質審核 |"
$lines += "|---|---:|---:|---:|"
foreach ($row in $summary) {
  $lines += "| $($row.learner) | $($row.total_words) | $($row.blocked_from_practice) | $($row.needs_quality_review) |"
}
$lines += ""
$lines += "## 待審核項目"
$lines += ""
$lines += "| 學習者 | 單字 | 詞性 | 目前中文 | 問題 | 建議 | 是否已排除練習 |"
$lines += "|---|---|---|---|---|---|---|"
foreach ($item in @($reviewItems | Select-Object -First 300)) {
  $pos = @($item.part_of_speech) -join ", "
  $meaning = ([string]$item.meaning) -replace "\|", "／"
  $issues = @($item.issues) -join "、"
  $suggestion = ([string]$item.suggestion) -replace "\|", "／"
  $blockedText = if ($item.practiceReady -eq $false) { "是" } else { "否" }
  $lines += "| $($item.learner) | $($item.word) | $pos | $meaning | $issues | $suggestion | $blockedText |"
}
$lines += ""
$lines += '完整 JSON 清單：`review/vocab-quality-review.json`'
Set-Content -LiteralPath $mdPath -Value ($lines -join "`n") -Encoding UTF8

$summary | ConvertTo-Json -Depth 10


