$ErrorActionPreference = "Stop"

$root = Join-Path $PSScriptRoot ".."
$reviewDir = Join-Path $root "review"
New-Item -ItemType Directory -Force -Path $reviewDir | Out-Null

$targets = @(
  @{ Path = "data\vocab_junior.json"; Label = "Sean 會考"; Level = "junior" },
  @{ Path = "data\vocab_gsat.json"; Label = "Ray 學測"; Level = "gsat" }
)

function Set-Prop($obj, [string]$name, $value) {
  if ($obj.PSObject.Properties[$name]) {
    $obj.$name = $value
  } else {
    $obj | Add-Member -NotePropertyName $name -NotePropertyValue $value -Force
  }
}

function Has-Forms($item) {
  return $item.forms -and $item.forms.base -and $item.forms.third_person -and $item.forms.past -and $item.forms.past_participle -and $item.forms.ing
}

function Has-AnyObjectProperty($obj) {
  return $obj -and @($obj.PSObject.Properties).Count -gt 0
}

function MeaningOf($item) {
  if ($item.PSObject.Properties["meaningZh"] -and $item.meaningZh) { return $item.meaningZh }
  return $item.chinese
}

$trustedVerbForms = @{}
$verbSourcePath = Join-Path $root "data\vocab_junior_verbs_source.json"
if (Test-Path $verbSourcePath) {
  $sourcePayload = Get-Content -LiteralPath $verbSourcePath -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($entry in @($sourcePayload.entries)) {
    if ($entry.word -and (Has-Forms $entry)) {
      $trustedVerbForms[$entry.word.ToLowerInvariant()] = @{
        forms = $entry.forms
        source = "動詞三態變化.pdf"
      }
    }
  }
}

function Get-ThirdPerson([string]$word) {
  if ($word -match "[^aeiou]y$") { return $word.Substring(0, $word.Length - 1) + "ies" }
  if ($word -match "(s|x|z|ch|sh|o)$") { return $word + "es" }
  return $word + "s"
}

function Get-TrustedRegularForms([string]$word) {
  if ($word -notmatch "^[a-z]+$") { return $null }

  $knownIrregular = @(
    "be","bear","beat","become","begin","bend","bet","bite","bleed","blow","break","bring","build","buy",
    "catch","choose","come","cost","cut","dig","do","draw","drink","drive","eat","fall","feel","fight",
    "find","fit","fly","forget","freeze","get","give","go","grow","hang","have","hear","hide","hit",
    "hold","hurt","keep","know","lay","lead","leave","lend","let","lie","light","lose","make","mean",
    "meet","pay","put","quit","read","ride","ring","rise","run","say","see","sell","send","set","shake",
    "shoot","show","shut","sing","sink","sit","sleep","speak","spend","spread","stand","steal","swim",
    "take","teach","tear","tell","think","throw","understand","wake","wear","win","write"
  )
  if ($knownIrregular -contains $word) { return $null }

  # These patterns often require consonant doubling or have spelling variants.
  # Keep them out of formal data until reviewed.
  if ($word -match "[^aeiou][aeiou][^aeiouwxy]$") { return $null }
  if ($word -match "c$") { return $null }

  $past = if ($word.EndsWith("e")) {
    $word + "d"
  } elseif ($word -match "[^aeiou]y$") {
    $word.Substring(0, $word.Length - 1) + "ied"
  } else {
    $word + "ed"
  }

  $ing = if ($word.EndsWith("ie")) {
    $word.Substring(0, $word.Length - 2) + "ying"
  } elseif ($word.EndsWith("e") -and -not $word.EndsWith("ee")) {
    $word.Substring(0, $word.Length - 1) + "ing"
  } else {
    $word + "ing"
  }

  return [pscustomobject]@{
    base = $word
    third_person = Get-ThirdPerson $word
    past = $past
    past_participle = $past
    ing = $ing
  }
}

$allReviewItems = @()
$summaryRows = @()

foreach ($target in $targets) {
  $path = Join-Path $root $target.Path
  $data = Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json
  $fromTrustedSource = 0
  $fromTrustedRule = 0
  $needsReviewForms = 0
  $needsReviewDetails = 0

  foreach ($item in @($data)) {
    $word = ([string]$item.word).Trim()
    $key = $word.ToLowerInvariant()
    $isVerb = @($item.part_of_speech) -contains "verb"

    if ($isVerb -and -not (Has-Forms $item)) {
      if ($trustedVerbForms.ContainsKey($key)) {
        Set-Prop $item "forms" $trustedVerbForms[$key].forms
        Set-Prop $item "forms_review_status" "trusted"
        Set-Prop $item "forms_source" $trustedVerbForms[$key].source
        $fromTrustedSource++
      } else {
        $forms = Get-TrustedRegularForms $key
        if ($forms) {
          Set-Prop $item "forms" $forms
          Set-Prop $item "forms_review_status" "trusted"
          Set-Prop $item "forms_source" "trusted_regular_rule"
          $fromTrustedRule++
        } else {
          Set-Prop $item "forms_review_status" "needs_review"
          $needsReviewForms++
          $allReviewItems += [pscustomobject]@{
            learner = $target.Label
            file = $target.Path
            id = $item.id
            word = $item.word
            part_of_speech = $item.part_of_speech
            meaning = MeaningOf $item
            review_type = "動詞變化"
            reason = "不規則、拼字變化不穩定，或原始詞條需要人工確認"
          }
        }
      }
    }

    $missing = @()
    if (-not (Has-AnyObjectProperty $item.word_family)) { $missing += "詞族" }
    if (-not $item.examples -or @($item.examples).Count -eq 0) { $missing += "例句" }
    if (-not $item.common_collocations -or @($item.common_collocations).Count -eq 0) { $missing += "常見搭配" }

    if ($missing.Count -gt 0) {
      Set-Prop $item "detail_review_status" "needs_review"
      $needsReviewDetails++
      $allReviewItems += [pscustomobject]@{
        learner = $target.Label
        file = $target.Path
        id = $item.id
        word = $item.word
        part_of_speech = $item.part_of_speech
        meaning = MeaningOf $item
        review_type = ($missing -join "、")
        reason = "這類內容需要確認自然用法，不直接放進正式學習"
      }
    }
  }

  Set-Content -LiteralPath $path -Value ($data | ConvertTo-Json -Depth 30) -Encoding UTF8
  $summaryRows += [pscustomobject]@{
    learner = $target.Label
    file = $target.Path
    total_words = @($data).Count
    trusted_forms_from_pdf = $fromTrustedSource
    trusted_forms_from_rule = $fromTrustedRule
    form_items_needing_review = $needsReviewForms
    detail_items_needing_review = $needsReviewDetails
  }
}

$reviewJsonPath = Join-Path $reviewDir "vocab-enrichment-review.json"
Set-Content -LiteralPath $reviewJsonPath -Value ($allReviewItems | ConvertTo-Json -Depth 20) -Encoding UTF8

$reviewMdPath = Join-Path $reviewDir "vocab-enrichment-review.md"
$lines = @()
$lines += "# 單字補強待審核清單"
$lines += ""
$lines += "本次規則：正式詞庫只寫入高可信動詞變化；詞族、例句、常見搭配等內容先列入待審核。"
$lines += ""
$lines += "## 補強摘要"
$lines += ""
$lines += "| 學習者 | 詞庫 | PDF可信動詞變化 | 規則可信動詞變化 | 動詞變化待審核 | 詳細資料待審核 |"
$lines += "|---|---:|---:|---:|---:|---:|"
foreach ($row in $summaryRows) {
  $lines += "| $($row.learner) | $($row.total_words) | $($row.trusted_forms_from_pdf) | $($row.trusted_forms_from_rule) | $($row.form_items_needing_review) | $($row.detail_items_needing_review) |"
}
$lines += ""
$lines += "## 待審核樣本（前 120 筆）"
$lines += ""
$lines += "| 學習者 | 單字 | 詞性 | 中文 | 待審核內容 | 原因 |"
$lines += "|---|---|---|---|---|---|"
foreach ($item in @($allReviewItems | Select-Object -First 120)) {
  $pos = @($item.part_of_speech) -join ", "
  $meaning = ([string]$item.meaning) -replace "\|", "／"
  $reason = ([string]$item.reason) -replace "\|", "／"
  $lines += "| $($item.learner) | $($item.word) | $pos | $meaning | $($item.review_type) | $reason |"
}
$lines += ""
$lines += '完整清單請看：`review/vocab-enrichment-review.json`'
Set-Content -LiteralPath $reviewMdPath -Value ($lines -join "`n") -Encoding UTF8

$summaryRows | ConvertTo-Json -Depth 10

