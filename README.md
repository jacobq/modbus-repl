## CLI arguments

- `--host`, `-h` address of the machine hosting modbus server
- `--port`, `-p` port on which modbus server is listening, by default `502`
- `--proto`, `-P` protocol to be used, possible options are `udp` or `tcp`, by default `tcp`
- `--headless`, `-H` if set, given `--command` will be executed after successful connection, it's result will be printed to stdout and application will exit
- `--command`, `-c` command to be executed in headless mode

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