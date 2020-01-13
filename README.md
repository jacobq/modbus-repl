## CLI arguments

- `--host`, `-h`
- `--port`, `-p`
- `--proto`, `-P`
- `--headless`, `-H`
- `--command`, `-c`

## commands

```sh
# write coils
wc A C1 C2 ... Cn
```

```sh
# write holding registers
wh A R1 R2 ... Rn
```

where:
- `A` is address on which writing should start
- `C` is coil value `1` or `0` that should be set
- `R` is 16-bit register value that should be set, hexadecimal format is supported with prefix `0x`


```sh
# read coils
rc A N
```
```sh
# read descrete coils
rd A N
```
```sh
# read input registers
ri A N
```
```sh
# read holding registers
rh A N
```

where:
- `A` address on which reading should start
- `N` number of registers or coils to read