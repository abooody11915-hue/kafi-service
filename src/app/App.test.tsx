import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("KAFI Service shell", () => {
  it("shows the public service-first experience", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /الصيانة التي تحتاجها/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /اطلب خدمة/ })).toBeInTheDocument();
    expect(screen.getByText("التكييف")).toBeInTheDocument();
  });

  it("shows an exception-first owner dashboard", () => {
    render(<MemoryRouter initialEntries={["/owner"]}><App /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "مركز قيادة المنصة" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "قرارات تحتاج تدخلك" })).toBeInTheDocument();
    expect(screen.getByText("بيانات اصطناعية للمعاينة")).toBeInTheDocument();
  });
});
