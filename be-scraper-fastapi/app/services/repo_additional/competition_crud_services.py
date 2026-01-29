import uuid
from app.repositories import d1_competition_crud as competition_crud
from app.services.unify.function import find_original_sentence
from app.models.competition import Competition, Report_File

def get_competition_application_link_via_en_name(name: str):
    competition_crud_class = competition_crud.CompetitionCRUD()
    competition_obj = competition_crud_class.get_competition_by_en_name(name)
    if competition_obj is None:
        return None
    return competition_obj.application_link_tr

def get_competition_obj_via_any_name(name: str | None):
    print(f"Searching competition for name: {name}")
    if name is None:
        return None
    competition_crud_class = competition_crud.CompetitionCRUD()
    unified_name = find_original_sentence(name)
    competition_obj = None
    if unified_name:
        competition_obj = competition_crud_class.get_competition_by_en_link(en_link=unified_name)
    if not competition_obj:
        competition_obj = competition_crud_class.get_competition_by_en_name(name=unified_name) if unified_name else None
        if not competition_obj:
            competition_obj = competition_crud_class.get_competition_by_tr_name(name=name)
            if not competition_obj:
                competition_obj = competition_crud_class.get_competition_by_en_name(name=name)
                if not competition_obj:
                    competition_obj = competition_crud_class.get_competition_by_ar_name(name=name)
                    if not competition_obj:
                        return None
    return competition_obj

def update_or_create_competition(
        link = None,
        image_link = None,
        tk_number = None,
        t3kys_number = None,
        application_link = None,
        comp_name = None,
        comp_description = None,
        comp_link = None,
        year = None,
        min_member = None,
        max_member = None,
        lang = None
):
    print(f"""
            received competition info:
            link: {link}
            image_link: {image_link}
            tk_number: {tk_number}
            t3kys_number: {t3kys_number}
            application_link: {application_link}
            comp_name: {comp_name}
            comp_description: {comp_description}
            comp_link: {comp_link}
            year: {year}
            min_member: {min_member}
            max_member: {max_member}
            lang: {lang}
        """)
    
    competition_obj_new: Competition = Competition()

    competition_obj_from_db = get_competition_obj_via_any_name(comp_name)
    competition_crud_class = competition_crud.CompetitionCRUD()
    if competition_obj_from_db:
        competition_obj_new = competition_obj_from_db


    if lang == "tr" or (link and "teknofest.org/tr" in link):
        lang = "tr"
        competition_obj_new.application_link_tr = application_link
        competition_obj_new.tr_name = comp_name
        competition_obj_new.tr_description = comp_description
        competition_obj_new.tr_link = comp_link
    elif lang == "en" or (link and "teknofest.org/en" in link):
        lang = "en"
        competition_obj_new.application_link_en = application_link
        competition_obj_new.en_name = comp_name
        competition_obj_new.en_description = comp_description
        competition_obj_new.en_link = comp_link
    else:
        lang = "ar"
        competition_obj_new.application_link_ar = application_link
        competition_obj_new.ar_name = comp_name
        competition_obj_new.ar_description = comp_description
        competition_obj_new.ar_link = comp_link


    if competition_obj_from_db:  # update existing competition
        if image_link:
            competition_obj_new.image_path = image_link
        if tk_number:
            competition_obj_new.tk_number = tk_number
        if t3kys_number:
            competition_obj_new.t3kys_number = t3kys_number
        if year and year not in competition_obj_new.years:
            competition_obj_new.years.append(year)
        if min_member:
            competition_obj_new.min_member = min_member
        if max_member:
            competition_obj_new.max_member = max_member

        if competition_obj_from_db.id:
            competition_crud_class.update_competition(int(competition_obj_from_db.id), competition_obj_new)

    else:  # create new competition
        competition_obj_new.image_path=image_link
        competition_obj_new.tk_number=tk_number
        competition_obj_new.t3kys_number=t3kys_number
        competition_obj_new.years=[year] if year else []
        competition_obj_new.min_member=min_member
        competition_obj_new.max_member=max_member

        competition_crud_class.create_competition(competition_obj_new)


    return competition_obj_new


def update_or_create_report_file(
        comp_name = None,
        team_id = None,
        year = None,
        file_path = None,
        rank = None,
        stage = None,
        language = None
):
    print(f"""
            received report file info:
            comp_name: {comp_name}
            team_id: {team_id}
            year: {year}
            file_path: {file_path}
            rank: {rank}
            stage: {stage}
    """)

    # get competition object
    competition_obj_from_db = get_competition_obj_via_any_name(comp_name)
    competition_crud_class = competition_crud.CompetitionCRUD()
    if competition_obj_from_db:
        competition_id = competition_obj_from_db.id
    else:
        print(f"No competition found for name: {comp_name}")
        return

    # create new report file object
    if not competition_id:
        print(f"No competition ID found for competition name: {comp_name}")
        return
    
    report_file_crud_class = competition_crud.ReportFileCRUD()
    report_file_obj_new: Report_File = Report_File(competition_id=competition_id, year=year or "", file_path=file_path or "")
    report_file_obj_from_db = None

    try:
        if team_id is not None:
            report_file_obj_from_db = report_file_crud_class.get_report_files_by_competition_id_and_team_id(int(competition_id), int(team_id))[0]
            if report_file_obj_from_db:
                report_file_obj_new = report_file_obj_from_db
    except:
        pass

    # update or create report file
    if competition_id:
        report_file_obj_new.competition_id = competition_id
    if team_id:
        report_file_obj_new.team_id = team_id
    if year:
        report_file_obj_new.year = year
    if file_path:
        report_file_obj_new.file_path = file_path
    if rank:
        report_file_obj_new.rank = rank
    if stage:
        report_file_obj_new.stage = stage
    if language:
        report_file_obj_new.language = language

    if report_file_obj_from_db and report_file_obj_from_db.id:
        print(f"Updating existing report file with ID: {report_file_obj_from_db.id}")
        report_file_crud_class.update_report_file(report_file_obj_from_db.id, report_file_obj_new)
    else:
        print(f"Creating new report file for competition ID: {competition_id}, team ID: {team_id}")
        report_file_crud_class.create_report_file(report_file_obj_new)

    return report_file_obj_new

# crud for CompetitionData
def update_or_create_competition_data(
        competition_id: int,
        year,
        timeline = None,
        awards = None,
        criteria = None
):
    print(f"""
            received competition data info:
            competition_id: {competition_id}
            year: {year}
            timeline: {timeline}
            awards: {awards}
            criteria: {criteria}
        """)
    
    competition_data_crud_class = competition_crud.CompetitionDataCRUD()
    if not competition_id:
        return None
    competition_data_obj_from_db = competition_data_crud_class.get_competition_data(competition_id, year)
    competition_data_obj_new = None
    if competition_data_obj_from_db:
        competition_data_obj_new = competition_data_obj_from_db
    else:
        competition_data_obj_new = competition_crud.CompetitionData(competition_id=competition_id, year=year)

    if timeline:
        competition_data_obj_new.timeline = timeline
    if awards:
        competition_data_obj_new.awards = awards
    if criteria:
        competition_data_obj_new.criteria = criteria

    if competition_data_obj_from_db:  # update existing competition data
        competition_data_crud_class.update_competition_data(competition_id, year, competition_data_obj_new)

    else:  # create new competition data
        competition_data_crud_class.create_competition_data(competition_data_obj_new)

    return competition_data_obj_new
