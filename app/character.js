import Form from "next/form";
import Select from "react-select";
import heroes from "./heroes";
import artifacts from "./artifacts";
import sets from "./sets";

const HERO_CR_PUSH = { Zio: 30 };

export function speedRange(playerSpeed, cr, heroName) {
  if (!playerSpeed || !cr) return null;
  const push = HERO_CR_PUSH[heroName] || 0;
  const effectiveSpeed =
    push > 0 ? playerSpeed / (1 - push / 100) : playerSpeed;
  const base = effectiveSpeed * (Number(cr) / 100);
  return `${Math.floor(base * 0.95)}-${Math.ceil(base * 1.05)}`;
}

export default function Character({ unit, info, setInfo }) {
  let number = null;

  switch (unit) {
    case 1:
      number = "firstChar";
      break;
    case 2:
      number = "secondChar";
      break;
    case 3:
      number = "thirdChar";
      break;
    default:
      break;
  }

  const updateTeam = (field, val) => {
    const updatedTeam = structuredClone(info);
    updatedTeam[number][field] = val;
    setInfo(updatedTeam);
  };

  const defaultHero = info[number].name;
  const defaultArti = info[number].artifact;
  const defaultHp = info[number].hp;
  const defaultSets = info[number].sets;
  const defaultMisc = info[number].misc;
  const defaultCr = info[number].cr;

  return (
    <section className="pt-8">
      <Form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1.5fr_1fr] gap-4">
        <Select
          options={heroes}
          className="text-black"
          placeholder="Character"
          value={defaultHero}
          isClearable
          instanceId={`${number}-hero`}
          onChange={(hero) => updateTeam("name", hero)}
        />
        <Select
          options={artifacts}
          className="text-black"
          placeholder="Artifact"
          value={defaultArti && defaultArti}
          isClearable
          instanceId={`${number}-artifact`}
          onChange={(artifact) => updateTeam("artifact", artifact)}
        />
        <input
          type="number"
          placeholder="HP"
          className="border px-2 py-1 rounded-sm"
          value={defaultHp > 0 ? defaultHp : ""}
          min={1}
          onChange={(hp) => {
            updateTeam("hp", Number(hp.target.value));
          }}
        />
        <Select
          options={sets}
          className="text-black"
          placeholder="Set/s"
          value={defaultSets}
          isClearable
          isMulti
          instanceId={`${number}-sets`}
          onChange={(sets) => updateTeam("sets", sets)}
        />
        <div className="flex gap-2 col-span-1 md:col-span-2 lg:col-span-2">
          <input
            type="number"
            placeholder="CR% (opt)"
            className="border px-2 py-1 rounded-sm w-28 shrink-0"
            value={defaultCr > 0 ? defaultCr : ""}
            min={1}
            max={100}
            onChange={(e) =>
              updateTeam("cr", e.target.value ? Number(e.target.value) : "")
            }
          />
          <input
            type="text"
            placeholder="Extra info: EEs, high eff/er, etc."
            className="border px-2 py-1 rounded-sm flex-1 min-w-0"
            value={defaultMisc}
            onChange={(misc) => updateTeam("misc", misc.target.value)}
          />
        </div>
      </Form>
    </section>
  );
}
