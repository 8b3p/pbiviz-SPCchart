import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

/**
 * Data Point Formatting Card
 */
class GeneralCardSettings extends FormattingSettingsCard {
    showTitleText = new formattingSettings.ToggleSwitch({
        name: "showTitleText",
        displayName: "Show Title",
        value: true
    });
    circleRadius = new formattingSettings.NumUpDown({
        name: "circleRadius",
        displayName: "Circle Radius",
        value: 3
    });
    textSize = new formattingSettings.NumUpDown({
        name: "textSize",
        displayName: "Text Size",
        value: 1
    });

    name: string = "general";
    displayName: string = "General";
    slices: Array<FormattingSettingsSlice> = [this.showTitleText, this.textSize, this.circleRadius];
}

class ColorsCardSettings extends FormattingSettingsCard {

    // top: 20, right: 20, bottom: 30, left: 70 
    STD = new formattingSettings.ColorPicker({
        name: "STD",
        displayName: "STD",
        value: {
            value: "#4d6adf",
            id: 1,
            shade: null
        }
    });
    upperLimit = new formattingSettings.ColorPicker({
        name: "upperLimit",
        displayName: "Upper Limit",
        value: {
            value: "#ff4550",
            id: 2,
            shade: null
        }
    });
    lowerLimit = new formattingSettings.ColorPicker({
        name: "lowerLimit",
        displayName: "Lower Limit",
        value: {
            value: "#14dF12",
            id: 3,
            shade: null
        }
    });
    median = new formattingSettings.ColorPicker({
        name: "median",
        displayName: "Median",
        value: {
            value: "#7C7C7C",
            id: 4,
            shade: null
        }
    });
    target = new formattingSettings.ColorPicker({
        name: "target",
        displayName: "Target",
        value: {
            value: "#000000",
            id: 5,
            shade: null
        }
    });

    name: string = "colors";
    displayName: string = "Colors";
    slices: Array<FormattingSettingsSlice> = [this.STD, this.upperLimit, this.lowerLimit, this.median, this.target];
}

class MarginCardSettings extends FormattingSettingsCard {

    // top: 20, right: 20, bottom: 30, left: 70 
    marginLeft = new formattingSettings.NumUpDown({
        name: "marginLeft",
        displayName: "Margin Left",
        value: 70
    });
    marginTop = new formattingSettings.NumUpDown({
        name: "marginTop",
        displayName: "Margin Top",
        value: 20
    });
    marginBottom = new formattingSettings.NumUpDown({
        name: "marginBottom",
        displayName: "Margin Bottom",
        value: 40
    });
    marginRight = new formattingSettings.NumUpDown({
        name: "marginRight",
        displayName: "Margin Right",
        value: 70
    });

    name: string = "margins";
    displayName: string = "Margins";
    slices: Array<FormattingSettingsSlice> = [this.marginTop, this.marginBottom, this.marginRight, this.marginLeft];
}

/**
* visual settings model class
*/
export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    // Create formatting settings model formatting cards
    generalCard = new GeneralCardSettings();
    marginCard = new MarginCardSettings();
    colorsCard = new ColorsCardSettings();

    cards = [this.generalCard, this.marginCard, this.colorsCard];
}
