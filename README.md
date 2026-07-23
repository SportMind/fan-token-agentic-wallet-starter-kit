fan-token-agentic-wallet-starter-kit — README.md PATCH — v1.4.0
================================================================
Three surgical find/replace changes. Apply in order.
================================================================

CHANGE 1 — SportMind version reference
Find (exact):
  This kit is built against **SportMind v3.63+**.

Replace with:
  This kit is built against **SportMind v4.1.22+**.

Location: Near bottom of file, under "## SportMind Version" section.

----------------------------------------------------------------

CHANGE 2 — Model string in LLM table
Find (exact):
  | Anthropic Claude *(recommended)* | `claude`               | `ANTHROPIC_API_KEY`                  | `claude-sonnet-4-5` |

Replace with:
  | Anthropic Claude *(recommended)* | `claude`               | `ANTHROPIC_API_KEY`                  | `claude-sonnet-4-6` |

Location: Under "## Choosing Your LLM" section, first row of table.

----------------------------------------------------------------

CHANGE 3 — WC2026 roadmap item marked complete
Find (exact):
  - [ ] World Cup 2026 module integration

Replace with:
  - [x] World Cup 2026 module integration

Location: Under "## Roadmap" section.

================================================================
All other content unchanged.
================================================================
