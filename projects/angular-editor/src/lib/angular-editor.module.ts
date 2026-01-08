import {NgModule} from '@angular/core';
import {AngularEditorComponent} from './editor/angular-editor.component';
import {AEButtonIsHiddenPipe, AeToolbarComponent} from './ae-toolbar/ae-toolbar.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import { AeSelectComponent } from './ae-select/ae-select.component';
import {AeButtonComponent} from "./ae-button/ae-button.component";
import { AeToolbarSetComponent } from './ae-toolbar-set/ae-toolbar-set.component';
import { ImageResizeService } from './image-resize.service';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule
  ],
  declarations: [AngularEditorComponent, AeToolbarComponent, AeSelectComponent, AeButtonComponent, AeToolbarSetComponent, AEButtonIsHiddenPipe],
  exports: [AngularEditorComponent, AeToolbarComponent, AeButtonComponent, AeToolbarSetComponent, AEButtonIsHiddenPipe],
  providers: [ ImageResizeService ]
})
export class AngularEditorModule {
}
