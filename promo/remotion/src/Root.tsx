import React from "react";
import { Composition } from "remotion";
import { Sample } from "./Sample";
import { V2 } from "./V2";
import { Promo } from "./Promo";
import { Promo15 } from "./Promo15";
import { Promo30 } from "./Promo30";
import { Promo30v2 } from "./Promo30v2";
export const Root: React.FC = () => (<>
  <Composition id="Sample" component={Sample} durationInFrames={150} fps={30} width={1080} height={1920} />
  <Composition id="V2" component={V2} durationInFrames={271} fps={30} width={1080} height={1920} />
  <Composition id="Promo" component={Promo} durationInFrames={1800} fps={30} width={1080} height={1920} />
  <Composition id="Promo15" component={Promo15} durationInFrames={450} fps={30} width={1080} height={1920} />
  <Composition id="Promo30" component={Promo30} durationInFrames={900} fps={30} width={1080} height={1920} />
  <Composition id="Promo30v2" component={Promo30v2} durationInFrames={900} fps={30} width={1080} height={1920} />
</>);
