import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
import powerbi from "powerbi-visuals-api";

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

    cards = [this.generalCard, this.marginCard];
}
