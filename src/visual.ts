import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import IVisual = powerbi.extensibility.visual.IVisual;

import { VisualFormattingSettingsModel } from "./settings";
import SPCchart, { IData, VisualSettings } from './components/SPCchart';
import NoData from './components/NoData'
import * as React from "react";
import * as ReactDOM from "react-dom";
import { timeParse } from 'd3'

export class Visual implements IVisual {
    private target: HTMLElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private reactRoot: React.FunctionComponentElement<any>;
    private reactNoData: React.FunctionComponentElement<any>;

    constructor(options: VisualConstructorOptions) {
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
    }

    public update(options: VisualUpdateOptions) {
        try {

            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews);
            if (options.dataViews && options.dataViews[0]) {
                try {
                    const cards = this.getFormattingModel().cards;
                    // @ts-ignore
                    const GeneralCard = cards[0].groups[0].slices;
                    // @ts-ignore
                    const MarginsCard = cards[1].groups[0].slices;
                    const settings: VisualSettings = {
                        general: {
                            showTitle: GeneralCard[0].control.properties.value,
                            textSize: GeneralCard[1].control.properties.value,
                            circleRadius: GeneralCard[2].control.properties.value,
                        },
                        margins: {
                            marginTop: MarginsCard[0].control.properties.value,
                            marginBottom: MarginsCard[1].control.properties.value,
                            marginRight: MarginsCard[2].control.properties.value,
                            marginLeft: MarginsCard[3].control.properties.value,
                        }
                    }
                    const dataView: DataView = options.dataViews[0];
                    const data = this.getData(dataView);
                    const width: number = options.viewport.width;
                    const height: number = options.viewport.height;
                    if (data instanceof Error) {
                        this.clear(data.message);
                        return;
                    }
                    this.reactRoot = React.createElement(SPCchart, { data, width, height, settings });
                    ReactDOM.unmountComponentAtNode(this.target);
                    ReactDOM.render(this.reactRoot, this.target);
                } catch (e) {
                    console.dir(e);
                    this.clear();
                }
            } else {
                this.clear();
            }
        } catch (e) {
            console.dir(e)
        }
    }
    clear(message?: string) {
        if (!this.reactNoData || message) this.reactNoData = React.createElement(NoData, { message });
        ReactDOM.unmountComponentAtNode(this.target);
        ReactDOM.render(this.reactNoData, this.target);
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private getData(dataView: DataView): IData | Error {
        try {
            if (!dataView.categorical.values || !dataView.categorical.categories) {
                throw new Error("Must select PointValue and PointDate")
            }
            let values: number[];
            let upperLimit: number;
            let lowerLimit: number;
            let target: number;
            let color: string[];
            for (let i = 0; i < dataView.categorical.values.length; i++) {
                if (dataView.categorical.values[i].source.roles.PointValue) {
                    values = <number[]>dataView.categorical.values[i].values;
                } else if (dataView.categorical.values[i].source.roles.UpperLimit) {
                    upperLimit = +dataView.categorical.values[i].values[0];
                } else if (dataView.categorical.values[i].source.roles.LowerLimit) {
                    lowerLimit = +dataView.categorical.values[i].values[0];
                } else if (dataView.categorical.values[i].source.roles.Target) {
                    target = +dataView.categorical.values[i].values[0];
                } else if (dataView.categorical.values[i].source.roles.Color) {
                    color = <string[]>dataView.categorical.values[i].values;
                }
            }
            const timeParser = timeParse('%B')
            let category: Date[] = [];
            if (dataView.categorical.categories.length === 4) {
                for (let i = 0; i < dataView.categorical.categories[0].values.length; i++) {
                    const year = +dataView.categorical.categories[0].values[i];
                    const month = timeParser(<string>dataView.categorical.categories[2].values[i]).getMonth();
                    const day = +dataView.categorical.categories[3].values[i];
                    const date = new Date(year, month, day)
                    category.push(date);
                }
            } else {
                for (let i = 0; i < dataView.categorical.categories[0].values.length; i++) {
                    //check if value is a date
                    const dateToBe = new Date(<string>dataView.categorical.categories[0].values[i])
                    if (dateToBe.toString() !== 'Invalid Date' &&
                        !isNaN(dateToBe.getTime()) &&
                        //checks if this a string containing a numbers
                        !/^-?\d*\.?\d+$/.test(<string>dataView.categorical.categories[0].values[i])
                    ) {
                        category.push(dateToBe)
                    } else {
                        return new Error('Date is not valid')
                    }
                }
            }
            const categoryArray = new Array(values.length)
                .fill({ value: null, date: null, color: "blue" })
                .map((_, i) => ({
                    value: values[i],
                    date: category[i],
                    color: color && color.length ? color[i] === "G" ? "green" : color[i] === "R" ? "red" : "blue" : "blue"
                }));
            const std = this.std(categoryArray.map(d => d.value))
            console.log(std)
            const Data: IData = {
                upperLimit,
                lowerLimit,
                target,
                std,
                categorical: categoryArray
            }
            return Data;
        } catch (e) {
            return e as Error
        }
    }

    private std(data: number[]): number {
        // Step 1: Calculate the mean
        const mean = data.reduce((sum, value) => sum + value, 0) / data.length;

        // Step 2: Calculate the squared differences from the mean
        const squaredDifferences = data.map((value) => (value - mean) ** 2);

        // Step 3: Calculate the variance
        const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / data.length;

        // Step 4: Calculate the standard deviation (square root of variance)
        const standardDeviation = Math.sqrt(variance);

        return standardDeviation;
    }
}

