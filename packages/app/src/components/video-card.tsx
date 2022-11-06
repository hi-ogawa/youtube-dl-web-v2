import type React from "react";
import { cls } from "../utils/misc";

export function VideoCard(props: {
  imageUrl?: string;
  title?: React.ReactNode;
  uploader?: React.ReactNode;
}) {
  /*
    Layout

    <- 16 -> <--- 20 --->
    ↑        ↑
    9 (cover)|
    ↓        ↓
   */

  return (
    <div
      className={cls(
        !props.imageUrl && "!bg-base-disabled",
        "relative w-full flex border bg-base"
      )}
      style={{ aspectRatio: "36 / 9" }}
    >
      <div
        className={cls(
          !props.imageUrl && "dark:(filter brightness-50)",
          "flex-none w-[44%] relative aspect-video overflow-hidden"
        )}
      >
        <div className="w-full h-full">
          <img
            className="absolute transform top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
            src={props.imageUrl ?? PLACEHOLDER_IMAGE}
          />
        </div>
      </div>
      <div className="grow p-2 flex flex-col relative text-sm">
        <div className="line-clamp-2 mb-2">{props.title}</div>
        <div className="line-clamp-1 text-base-content-secondary pr-8">
          {props.uploader}
        </div>
      </div>
    </div>
  );
}

// taken from https://roadmaptoprofit.com/process-power-pack-for-businesses/video-placeholder/
const PLACEHOLDER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACoCAMAAABt9SM9AAAAG1BMVEXd3d3MzMzOzs7b29vU1NTY2NjS0tLW1tbf399oO5GCAAAE/ElEQVR4nO2dWYKDIBBEHRDk/iceURsVt24UFVPvc8YYKGgo1lQVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACScCs8naY30KrgqkEN3WI8zQrdP/wTVS9m97HqJzTsq0orTVPXVin1J6T9iK3rxujxZd+kzZoxXiKpQlu62boV7YuCtULVF6kUaVabjwWl03mUGrDmS3LVGZXqUObpLF5GzlpFNN+oXG6pVQ71PhGKzq5lzXuAzgR0Lmp4cpX+f70T84ZjszvVz+XxKpyZi2RtK5Cu5v78qP+fPDj42FY3O4hG2qmc2biJsR74Xv4yJ9mL1vq2sSDq0gPRNVT8VufwQ87pJhTH9a+/GcqJzVfsWn2jalHFytugmDu+5AaoSclrGu/5ltzoe8qcqlbGWM+Po3FObsdIrVbeb8mMvScTbdOobimUnFAUWsazp+aQ6YtK7g+NIAoba026XOTmUz//PDQs5GShy63ViWpR41iwWFTex1EYeoLUOAp1OO3jL4DfkkymcdLa6PIbLX6TNZ3zskljSHYlfikhthiPzuaomkqsl6R5fCWCDESzqUoci2F2Iymlb4BC4zjni6lncb9IIZ/anz7OGFVHrMzTC1cgNHn4xLQ+jKMeipH+FbH+lKyS8EvmlfSRoTgrCSTWfDFC0rXRG+rk5D5KmPjjPBuyOl8L4jf0jt9AvpEwBGEkf8yqM/PKxY3Fwr0DJZ9T1qFm+a1X88X+mue5JEXzQiSBMRHL9wyzWOSZrsKN1kwA2bNxLHIqFxmtk6l+iiH1HMO0FDaOxUO+IRbHJi7FcnpWudThEm2w8CdT/RCC1K+FbLAeFIv76KLFkqR+tX2LG/r9eP5xsRYN/f4ASBD17+MCsZama0etosWSdE/bNiNq6HdCEWJNX9RF4vY7IFb3TwOxpuyKNe0TdwwExHLV3G3t9Ic/L1bsHfaUKFqs89ZhOVuzx2+LFe0Ktwcv+oRYaQPp2GAdzjCXPdw5Nesgi0DPN2YdOItTsViiQWFP4WIlz5TKphsGyp78S52Dd9FEFnPFQrDw9kJSV3fkEdi9ofDVnYR1w1as+Sore8dD6euGKSvSkbXi79MK9fhEip9E0D+NG0MmMagku5cL3+sg2QW0totGuD2U4jYxsY/Db3eWYh0NbmIk44VXwt8UOxdLJeyTFOxveiWhgxLXLKa1mr6gbJsl2qsxE0u45a9/QdnOoZIcewhiqdTrLMrey+Zh92vj5Q9pRwZC+17uxSFhp+jxo0MlTL1TxpV/dofmpBSji6r7epF6KuymU6A5EZw3dLo5UyuoDhcbhdV9x4+oVIr179UkOjJbxbu+Jyuh3c19DLD8U78ecgRZzx+Fs3rlGgdPiI+8ZpEmdkqOwmo0ixkL3QX7X7B97xiteZPnhkw3WYwt9qxhgHLyp2x/I9tVL+5vaLPjELz0ilVFu/+V7e/6dcM1yWIcXS2iTRPf/ld4i+VZmzH+665H9LdMa7ol+QD/lL8ksWk2r0gsuysk1nK2pt8WvM9/IAg9mpndU9iP3EgdL5xmQD5n/2JM1sqlSh4/L3GVbvJUL2WbLHd6Pk53d/6VOtXmA3ZhC/pVhu3+nyFR5zqMqY5vGf4C/U92DDntbpjuftqj7rAT+r/Q736Mluy6S4dLhGdKAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAg4B88gCS4KbIjZAAAAABJRU5ErkJggg==";
