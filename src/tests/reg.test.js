const reg = require("../reg.js");

let suites = {
  standard: {
    valid: [
      "https://github.com/confused-Techie/atom-backend"
    ],
    invalid: [
      "git@github.com:confused-Techie/atom-backend.git",
      "git@github.com:confused-Techie/atom-backend"
    ]
  },
  protocol: {
    valid: [
      "git@github.com:confused-Techie/atom-backend.git",
      "git@github.com:confused-Techie/atom-backend"
    ],
    invalid: [
      "https://github.com/confused-Techie/atom-backend"
    ]
  },
  authorCompact: {
    valid: [
      "confused-Techie <dev@lhbasics.com> (https://pulsar-edit.dev)"
    ],
    invalid: [
      "confused-Techie",
      "<dev@lhbasics.com>",
      "(https://pulsar-edit.dev)"
    ]
  },
  authorOptionalCompact: {
    valid: [
      "confused-Techie (https://pulsar-edit.dev)",
      "confused-Techie <dev@lhbasics.dev>",
      "<dev@lhbasics.dev> (https://pulsar-edit.dev)"
    ],
    invalid: [
      "confused-Techie (https://pulsar-edit.dev) <dev@lhbasics.dev>"
    ]
  }
}

describe("Standard GitHub Repository Link", () => {

  describe("Returns true `.test()` of Valid Data", () => {

    for (let i = 0; i < suites.standard.valid.length; i++) {
      test(`${suites.standard.valid[i]} - reg.repoLink.standard.test()`, () => {
        expect(reg.repoLink.standard.test(
          suites.standard.valid[i]
        )).toBeTruthy();
      });
    }

  });

  describe("Returns false `.test()` of Invalid Data", () => {

    for (let i = 0; i < suites.standard.invalid.length; i++) {
      test(`${suites.standard.invalid[i]} - reg.repoLink.standard.test()`, () => {
        expect(reg.repoLink.standard.test(
          suites.standard.invalid[i]
        )).toBeFalsy();
      });
    }

  });

  test("Returns Expected Data from Match", () => {
    let res = suites.standard.valid[0].match(reg.repoLink.standard);

    expect(res[1]).toBe("confused-Techie");
    expect(res[2]).toBe("atom-backend");

  });

});

describe("Protocol GitHub Repository Link", () => {

  describe("Returns true `.test()` of Valid Data", () => {

    for (let i = 0; i < suites.protocol.valid.length; i++) {
      test(`${suites.protocol.valid[i]} - reg.repoLink.protocol.test()`, () => {
        expect(reg.repoLink.protocol.test(
          suites.protocol.valid[i]
        )).toBeTruthy();
      });
    }

  });

  describe("Returns false `.test()` of Invalid Data", () => {

    for (let i = 0; i < suites.protocol.invalid.length; i++) {
      test(`${suites.protocol.invalid[i]} - reg.repoLink.protocol.test()`, () => {
        expect(reg.repoLink.protocol.test(
          suites.protocol.invalid[i]
        )).toBeFalsy();
      });
    }

  });

  test("Returns Expected Data from Match", () => {
    let res = suites.protocol.valid[0].match(reg.repoLink.protocol);

    expect(res[1]).toBe("confused-Techie");
    expect(res[2]).toBe("atom-backend.git");
  });

});

describe("Compact Author Field", () => {

  describe("Returns true `.test()` of Valid Data", () => {

    for (let i = 0; i < suites.authorCompact.valid.length; i++) {
      test(`${suites.authorCompact.valid[i]} - reg.author.compact.test()`, () => {
        expect(reg.author.compact.test(
          suites.authorCompact.valid[i]
        )).toBeTruthy();
      });
    }

  });

  describe("Returns false `.test()` of Invalid Data", () => {
    for (let i = 0; i < suites.authorCompact.invalid.length; i++) {
      test(`${suites.authorCompact.invalid[i]} - reg.author.compact.test()`, () => {
        expect(reg.author.compact.test(
          suites.authorCompact.invalid[i]
        )).toBeFalsy();
      });
    }

  });

  test("Returns Expected Data from Match", () => {
    let res = suites.authorCompact.valid[0].match(reg.author.compact);

    expect(res[1]).toBe("confused-Techie");
    expect(res[2]).toBe("dev@lhbasics.com");
    expect(res[3]).toBe("https://pulsar-edit.dev");
  })
});

describe("Optional Compact Author Field", () => {
  describe("Returns true `.test()` of Valid Data", () => {
    for (let i = 0; i < suites.authorOptionalCompact.valid.length; i++) {
      test(`${suites.authorOptionalCompact.valid[i]} - reg.author.optional_compact.test()`, () => {
        expect(reg.author.optional_compact.test(
          suites.authorOptionalCompact.valid[i]
        )).toBeTruthy();
      });
    }
  });

  describe("Returns false `.test()` of Invalid Data", () => {
    for (let i = 0; i < suites.authorOptionalCompact.invalid.length; i++) {
      test(`${suites.authorOptionalCompact.invalid[i]} - reg.author.optional_compact.test()`, () => {
        expect(reg.author.optional_compact.test(
          suites.authorOptionalCompact.invalid[i]
        )).toBeFalsy();
      });
    }
  });

  test("Returns Expected Data from Matches", () => {
    let res1 = suites.authorOptionalCompact.valid[0].match(reg.author.optional_compact);
    expect(res1[1].trim()).toBe("confused-Techie");
    expect(res1[3]).toBe("https://pulsar-edit.dev");

    let res2 = suites.authorOptionalCompact.valid[1].match(reg.author.optional_compact);
    expect(res2[1].trim()).toBe("confused-Techie");
    expect(res2[2]).toBe("dev@lhbasics.dev");

    let res3 = suites.authorOptionalCompact.valid[2].match(reg.author.optional_compact);
    expect(res3[2]).toBe("dev@lhbasics.dev");
    expect(res3[3]).toBe("https://pulsar-edit.dev");
  })
});
