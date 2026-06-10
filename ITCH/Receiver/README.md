# Receiver Application for PSE ITCH

The Receiver interfaces with the PSE New Trading System ITCH Server Feed via SoupBinTCP. It extracts sequenced data messages containing market structure states, converts them to JSON, and distributes the data via Socket.IO, TCP relay, and REST APIs.

## Directory Structure

```text
ITCH/Receiver/
  config/                  # Configuration files
  src/
    cli/                   # Command line parsing rules
    config/                # Config loading module
    protocol/              # SoupBinTCP network framing and decoding
    parsers/
      v2015/               # ITCH V2015 specification
      v2026/               # ITCH V2026 specification
    storage/               # Redis handlers
    servers/               # WebSocket/TCP Relay/Retransmission APIs
    services/              # Core packet processors and logging
    utils/                 # Big-endian math handling
  tests/                   # Unit test suite
```

## Configuration Guide
The application relies on `receiver.config.json` inside the `config` folder. Ensure it contains:
* **PROD & DR:** Environment credentials and host addresses.
* **Redis:** Enabled status, Host, Port, database indexing.
* **SocketIo, tcpRelay, tcpRetransmission, apiServer:** Feature flags and local host port mappings.
* **Logging:** Level and standard rolling constraints.

## How to Execute the Application

To execute the Receiver application, use Node.js and point it to the main `Receiver.js` file, providing exactly 5 required command-line arguments in the specified order.

### Execution Command Format

```bash
node src/Receiver.js <ENV> <START_MODE> <VERSION> <DISPLAY_MODE> <INITIALS>
```

### Parameter Explanations

The application requires exactly 5 arguments:

1. **Env (`PROD` | `DR`)**:
   * Indicates the environment configuration to load from `receiver.config.json`.
   * Example: `PROD`
2. **Start Mode (`START:Y` | `START:N`)**:
   * `START:Y`: Drops cache/memory logs, initializes the sequence to `1`, and starts a fresh session.
   * `START:N`: Resumes an existing session from Redis state, loading the previous session ID and requesting `lastSequenceNo + 1`.
   * Example: `START:Y`
3. **Version (`V2026` | `V2015`)**:
   * Targets the underlying ITCH decode mapping specification.
   * Example: `V2026`
4. **Display (`DISPLAY:ON` | `DISPLAY:OFF`)**:
   * Enables (`DISPLAY:ON`) or disables (`DISPLAY:OFF`) printing parsed packets directly to the console.
   * Example: `DISPLAY:ON`
5. **Initials (e.g., `JP` or `JP,AB`)**:
   * Determines standard logging metadata. Multiple initials must be separated by a comma.
   * Example: `JP`

### Execution Examples

**Start a fresh session in Production for V2026 with display on:**
```bash
node src/Receiver.js PROD START:Y V2026 DISPLAY:ON JP
```

**Resume an existing session (Disaster Recovery env) using V2015 without console display:**
```bash
node src/Receiver.js DR START:N V2015 DISPLAY:OFF JP,OPS
```

*Note: Ensure your Redis server is running and accessible based on your `receiver.config.json` before executing the application to persist data properly.*

## Sequence Handling
The Receiver operates exclusively via local increment tracking. ONLY `Sequenced Data Packet (S)` advances the current known sequence pointer. Inbound Debug, Heartbeat, and generic events do NOT mutate the sequence integer.

## SoupBinTCP Packet Types Supported
* Login Request/Accepted/Rejected `L` `A` `J`
* Sequenced Data `S`
* Server/Client Heartbeat `H` `R`
* Unsequenced Data `U`
* Debug `+`
* Logout / Session End `O` `Z`

## Redis Data Model
All records utilize standard pipeline caching via `ioredis`.
* Session Key: `receiver:{env}:{version}:session` (Hash holding status and state parameters)
* Binaries Stream: `receiver:{env}:{version}:packets:binary` and `...messages:binary`
* JSON Ranges: `receiver:{env}:{version}:messages:json` (Sorted sets tracked by sequence score for fast retrieval).

## TCP Retransmission Request Format
Request JSON sent over TCP delimted by newlines:
```json
{
  "socketID": "socket_io_client_id_optional",
  "beginningSequence": 100,
  "endingSequence": 120
}
```

## Socket IO Event list
* `packet`
* `message`
* `login_accepted` / `login_rejected`
* `heartbeat`
* `end_of_session`
* `error`

## Troubleshooting Checklist
* **Parser Error:** Ensure Big-Endian mapping and V2015 vs V2026 flag is matching the feed version.
* **Login Rejected:** Verify username / password and check log reason (Not Authorized or Session Not Available).
* **Redis Unavailable:** Receiver can work transiently in memory, but performance metrics require the 127.0.0.1 node config matches the active container map.
* **No Heartbeat:** App automatically closes socket on max connect timeouts. Make sure `maxReconnectDelayMs` reflects the current environment conditions.
