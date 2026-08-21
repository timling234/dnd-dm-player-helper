export async function getNextStub(language = "en") {
  // Fixed post-apocalyptic demo content for /api/next.
  if (language === "zh") {
    return {
      dm_read_aloud: "夕阳被尘埃遮蔽，废墟间的冷风像锈蚀的刀锋掠过脸庞。你们站在一座坍塌高楼的阴影下，脚边是早已废弃的地铁入口。",
      choices: [
        { id: "c1", text: "进入地铁，寻找幸存者留下的痕迹。" },
        { id: "c2", text: "沿街前往远处仍有微光的避难所。" },
        { id: "c3", text: "爬上残破高楼，观察周围的废墟。" },
        { id: "c4", text: "原地扎营，检查装备并安排守夜。" }
      ],
      dm_private: "无论玩家选择哪条路，下一幕都可以揭示城市地下的旧世界秘密，或引入一段神秘的无线电信号。",
      need_clarify: false,
      clarify_question: ""
    };
  }
  return {
    dm_read_aloud: "Dust blots out the setting sun as a cold wind cuts through the ruins. You stand beneath the shadow of a collapsed tower, beside the rusted entrance to a long-abandoned subway station.",
    choices: [
      { id: "c1", text: "Descend into the subway and search for signs of survivors." },
      { id: "c2", text: "Follow the street toward the faint light of a ruined shelter." },
      { id: "c3", text: "Climb the damaged tower to survey the surrounding ruins." },
      { id: "c4", text: "Make camp, check your equipment, and set a watch." }
    ],
    dm_private: "Whichever path the players choose, the next scene can reveal an old-world secret beneath the city or introduce a mysterious radio signal.",
    need_clarify: false,
    clarify_question: ""
  };
}

