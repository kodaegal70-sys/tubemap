$ids = @("16737435", "1437553085")
foreach ($id in $ids) {
    $url = "https://place.map.kakao.com/main/v/$id"
    $out = "$PSScriptRoot/../src/data/kakao_cache/$id.json"
    Write-Host "Downloading $id to $out ..."
    curl.exe -s -H "User-Agent: Mozilla/5.0" "$url" -o "$out"
}
