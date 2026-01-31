$r = Invoke-WebRequest -Uri "https://place.map.kakao.com/main/v/16737435" -Headers @{ "User-Agent" = "Mozilla/5.0" } -UseBasicParsing; Write-Host $r.Content
