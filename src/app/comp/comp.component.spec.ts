import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompComponent } from './comp.component';

describe('CompComponent', () => {
  let component: CompComponent;
  let fixture: ComponentFixture<CompComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompComponent]
    });
    fixture = TestBed.createComponent(CompComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
