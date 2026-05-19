import { describe, expect, it } from "vitest";
import {
  calculateBaseAmount,
  calculateCommissionAmount,
  calculateCommissionRate,
  calculateNonFeeAmount,
} from "./commission";

describe("commission rules", () => {
  it("gives IDP agents a 12 percent commission rate", () => {
    expect(calculateCommissionRate({ AgentCompanyName: "IDP Education Pty Ltd" })).toBe(12);
  });

  it("gives normal agents a 10 percent commission rate", () => {
    expect(calculateCommissionRate({ AgentCompanyName: "ALFALINK - Surabaya" })).toBe(10);
  });

  it("calculates Bachelor non-fee amount", () => {
    expect(
      calculateNonFeeAmount({
        ProgramName: "Bachelor of Business",
      }),
    ).toBe(375);

    expect(
      calculateNonFeeAmount({
        ProgramName: "Bachelor of Business in Food and Beverage Service",
      }),
    ).toBe(1580);
  });

  it("calculates Certificate IV non-fee amount", () => {
    expect(
      calculateNonFeeAmount({
        ProgramName: "SIT40521 Certificate IV in Kitchen Management",
      }),
    ).toBe(1397);
  });

  it("calculates base amount as total payment minus non-fee amount", () => {
    expect(
      calculateBaseAmount({
        AmountToPayOverride: 3000,
        ProgramName: "SIT40521 Certificate IV in Kitchen Management",
      }),
    ).toBe(1603);
  });

  it("calculates commission as base amount multiplied by rate divided by 100", () => {
    expect(
      calculateCommissionAmount({
        AgentCompanyName: "IDP Education Pty Ltd",
        AmountToPayOverride: 3000,
        ProgramName: "SIT40521 Certificate IV in Kitchen Management",
      }),
    ).toBeCloseTo(192.36);
  });
});
