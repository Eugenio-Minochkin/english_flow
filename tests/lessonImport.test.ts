import { describe, expect, test } from "vitest";
import { parseLessonWords } from "../src/core/lessons/lessonImport.service.js";

describe("lesson import parsing", () => {
  test("extracts unique words from multiline and comma-separated lesson input", () => {
    expect(parseLessonWords("imply, get stuck\nfall apart\nimply")).toEqual(["imply", "get stuck", "fall apart"]);
  });
});
