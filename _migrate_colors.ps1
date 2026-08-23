$files = @(
    "C:\Users\Honor\Desktop\Projects\izledin.com\src\components\onboarding\TasteProfilerModal.tsx",
    "C:\Users\Honor\Desktop\Projects\izledin.com\src\components\premium\PremiumModal.tsx"
)

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file)

    # === PHASE 1: Context-dependent colors — dark: prefix gets different mapping ===
    # dark: #facc15 -> #F59E0B
    $content = $content -replace '(dark:\S*?)#facc15', '${1}#F59E0B'
    # dark: #eab308 -> #D97706
    $content = $content -replace '(dark:\S*?)#eab308', '${1}#D97706'
    # dark: #09090b -> #0C0A09
    $content = $content -replace '(dark:\S*?)#09090b', '${1}#0C0A09'
    # dark: #e4e4e7 -> #D6D3D1
    $content = $content -replace '(dark:\S*?)#e4e4e7', '${1}#D6D3D1'

    # === PHASE 2: Remaining (non-dark) context-dependent colors ===
    $content = $content -replace '#facc15', '#D97706'
    $content = $content -replace '#eab308', '#B45309'
    $content = $content -replace '#09090b', '#1C1917'
    $content = $content -replace '#e4e4e7', '#E7E5E4'

    # === PHASE 3: Colors that map identically in both contexts ===
    $content = $content -replace '#fafafa', '#FAFAF9'
    $content = $content -replace '#f4f4f5', '#F5F5F4'
    $content = $content -replace '#121215', '#1C1917'
    $content = $content -replace '#18181b', '#292524'
    $content = $content -replace '#27272a', '#44403C'
    $content = $content -replace '#71717a', '#78716C'
    $content = $content -replace '#a1a1aa', '#A8A29E'
    $content = $content -replace '#e11d48', '#DC2626'
    $content = $content -replace '#f43f5e', '#EF4444'

    [System.IO.File]::WriteAllText($file, $content)
    Write-Host "Updated: $(Split-Path $file -Leaf)"
}
Write-Host "Done."
