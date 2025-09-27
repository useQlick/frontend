import React from "react";
import { Button } from "../../components/ui/button";

export const MacbookAir = (): JSX.Element => {
  const navigationItems = [
    { label: "Features", left: "left-[481px]" },
    { label: "Home", left: "left-[583px]" },
    { label: "About Us", left: "left-[668px]" },
    { label: "Contact", left: "left-[773px]" },
  ];

  const separators = [
    { left: "left-[556px]" },
    { left: "left-[641px]" },
    { left: "left-[746px]" },
  ];

  return (
    <div className="bg-black w-full min-w-[1280px] min-h-[832px] relative">
      <img
        className="absolute top-[41px] left-24 w-[47px] h-[47px]"
        alt="Frame"
        src="/frame.svg"
      />

      {navigationItems.map((item, index) => (
        <div
          key={index}
          className={`absolute top-[57px] ${item.left} [font-family:'Instrument_Sans',Helvetica] font-bold text-white text-xs tracking-[0] leading-[normal] cursor-pointer hover:opacity-80`}
        >
          {item.label}
        </div>
      ))}

      <div className="left-[1017px] absolute top-[57px] [font-family:'Instrument_Sans',Helvetica] font-bold text-white text-xs tracking-[0] leading-[normal] cursor-pointer hover:opacity-80">
        Contact
      </div>

      {separators.map((separator, index) => (
        <div
          key={index}
          className={`absolute top-[63px] ${separator.left} w-[3px] h-[3px] bg-[#d9d9d9] rounded-[1.5px]`}
        />
      ))}

      <div className="top-[49px] left-[1115px] w-[71px] absolute h-8">
        <Button className="w-[69px] h-8 bg-[#d9d9d9] rounded-[31px] hover:bg-[#c9c9c9] h-auto">
          <span className="[font-family:'Instrument_Sans',Helvetica] font-bold text-[#272635] text-xs tracking-[0] leading-[normal]">
            Join us!
          </span>
        </Button>
      </div>

      <div className="top-[369px] left-[996px] w-[121px] absolute h-8">
        <Button className="w-[119px] h-8 bg-[#ff7bc0] rounded-[31px] hover:bg-[#ff6bb5] h-auto">
          <span className="w-[94px] [font-family:'Instrument_Sans',Helvetica] font-bold text-black text-xs text-center tracking-[0] leading-[normal]">
            Get Started →
          </span>
        </Button>
      </div>

      <div className="absolute top-[203px] left-[133px] [font-family:'Instrument_Serif',Helvetica] font-normal text-transparent text-9xl tracking-[0] leading-[87.1px]">
        <span className="text-white">
          Prediction
          <br />
        </span>

        <span className="text-[#ff7bc0]">Market</span>
      </div>

      <img
        className="absolute top-[473px] left-[calc(50.00%_-_533px)] w-[1066px] h-[359px]"
        alt="Rectangle"
        src="/rectangle-2.svg"
      />

      <div className="absolute top-[522px] left-[802px] w-[262px] h-[262px] bg-white rounded-[131px]" />

      <div className="absolute top-[522px] left-[491px] w-[262px] h-[262px] bg-white rounded-[131px]" />

      <img
        className="absolute top-[585px] left-[618px] w-[135px] h-[135px]"
        alt="Ellipse"
        src="/ellipse-7.svg"
      />

      <img
        className="absolute top-[585px] left-[928px] w-[135px] h-[135px]"
        alt="Ellipse"
        src="/ellipse-7.svg"
      />
    </div>
  );
};
