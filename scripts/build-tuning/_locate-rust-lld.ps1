$sysroot = rustc --print sysroot
Get-ChildItem -Path $sysroot -Recurse -Filter 'rust-lld.exe' -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty FullName
